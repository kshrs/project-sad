import React, { useEffect, useState } from 'react';
import {
  getSheetEntriesByMonth,
  getSheetItems,
  getSheetColumns,
  createSheetEntry,
  updateSheetEntry,
  deleteSheetEntry,
  uploadFile,
  getFileUrl,
  type ColumnMeta
} from '../services/sheetService';
import { useReport } from '../context/ReportContext';
import './Mainpage.css';

interface MainpageProps {
  sheetName: string | null;
}

// Keys to omit from table view
const EXCLUDED_FIELDS = new Set([
  '_id',
  '__v',
  'month_id',
  'created_by',
  'createdAt',
  'updatedAt'
]);

// Helper to check if a column represents a file
function isFileField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower.includes('file') || lower.includes('document') || lower.includes('proof') || lower.includes('attachment');
}

// Format camelCase / snake_case into readable column header
function formatColumnHeader(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Format date values to simple regular format (DD/MM/YYYY)
function formatDateSimple(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format values (Objects, Dates, Booleans, nulls) for cell rendering
function formatCellValue(val: any, colName?: string): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';

  // If already a Date instance
  if (val instanceof Date) {
    return formatDateSimple(val);
  }

  // If string matches ISO date format (e.g. 2026-08-14T00:00:00.000Z or 2026-08-14)
  if (typeof val === 'string') {
    const isIsoDate = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(val);
    const isDateCol = colName ? colName.toLowerCase().includes('date') : false;

    if (isIsoDate || (isDateCol && !isNaN(Date.parse(val)))) {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return formatDateSimple(parsed);
      }
    }
    return val;
  }

  if (typeof val === 'object') {
    if (val._bsontype === 'ObjectID' || val.$oid) return String(val);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  return String(val);
}

export const Mainpage: React.FC<MainpageProps> = ({ sheetName }) => {
  const { monthId, currentMonthName, triggerRefresh } = useReport();
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMetaMap, setColumnMetaMap] = useState<Record<string, ColumnMeta>>({});
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Row input/editing state
  const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [fileOriginalNames, setFileOriginalNames] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadData = async () => {
    if (!sheetName) {
      setColumns([]);
      setColumnMetaMap({});
      setRows([]);
      setIsAddingRow(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsAddingRow(false);
    setNewRowData({});
    setValidationErrors({});

    try {
      // 1. Fetch schema column definitions from backend
      let schemaCols: string[] = [];
      const metaMap: Record<string, ColumnMeta> = {};

      try {
        const colRes = await getSheetColumns(sheetName);
        if (colRes && colRes.columns && Array.isArray(colRes.columns)) {
          colRes.columns.forEach((c) => {
            const colName = typeof c === 'string' ? c : c?.name;
            if (colName && !EXCLUDED_FIELDS.has(colName.toLowerCase())) {
              schemaCols.push(colName);
              metaMap[colName] = typeof c === 'string' ? { name: colName, type: 'String' } : c;
            }
          });
        }
      } catch (colErr) {
        console.warn('Could not fetch schema columns via API:', colErr);
      }

      // 2. Fetch sheet entries
      let dataItems: Record<string, any>[] = [];
      if (monthId) {
        const res = await getSheetEntriesByMonth(sheetName, monthId);
        dataItems = res.data || res.items || res.entries || [];
      } else {
        const res = await getSheetItems(sheetName);
        dataItems = res.data || res.items || res.entries || [];
      }

      // 3. If schema columns were not fetched or empty, extract from rows
      if (schemaCols.length === 0 && Array.isArray(dataItems)) {
        const keySet = new Set<string>();
        dataItems.forEach((row) => {
          if (row && typeof row === 'object') {
            Object.keys(row).forEach((k) => {
              if (!EXCLUDED_FIELDS.has(k.toLowerCase())) {
                keySet.add(k);
                if (!metaMap[k]) metaMap[k] = { name: k, type: 'String' };
              }
            });
          }
        });
        schemaCols = Array.from(keySet);
      }

      // Default fallback if table is completely empty and schema not returned
      if (schemaCols.length === 0) {
        schemaCols = ['s_no', 'faculty_name', 'department', 'details', 'file_name'];
        schemaCols.forEach((k) => {
          metaMap[k] = { name: k, type: k === 's_no' ? 'Number' : 'String' };
        });
      }

      setColumns(schemaCols);
      setColumnMetaMap(metaMap);
      setRows(Array.isArray(dataItems) ? dataItems : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch sheet data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sheetName, monthId]);

  // Open the new row editor
  const handleOpenAddRow = () => {
    const initialData: Record<string, any> = {};
    columns.forEach((col) => {
      if (col === 's_no' || col === 'sno') {
        initialData[col] = rows.length + 1;
      } else {
        initialData[col] = '';
      }
    });
    setEditingRowId(null);
    setNewRowData(initialData);
    setValidationErrors({});
    setIsAddingRow(true);
  };

  // Open an existing row for editing
  const handleStartEditRow = (row: Record<string, any>) => {
    const editData: Record<string, any> = {};
    columns.forEach((col) => {
      const val = row[col];
      const type = (columnMetaMap[col]?.type || 'String').toLowerCase();

      if (type === 'date' && val) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          editData[col] = d.toISOString().split('T')[0]; // Format for HTML date picker
        } else {
          editData[col] = val;
        }
      } else {
        editData[col] = val ?? '';
      }
    });

    setEditingRowId(row._id);
    setNewRowData(editData);
    setValidationErrors({});
    setIsAddingRow(true);
  };

  // Delete a row with confirmation
  const handleDeleteRow = async (rowId: string) => {
    if (!sheetName || !rowId) return;

    const confirmed = window.confirm('Are you sure you want to delete this entry? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteSheetEntry(sheetName, rowId);
      setRows((prev) => prev.filter((r) => r._id !== rowId));
      triggerRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete row');
    } finally {
      setLoading(false);
    }
  };

  // Cancel new row creation / editing
  const handleCancelAddRow = () => {
    setIsAddingRow(false);
    setEditingRowId(null);
    setNewRowData({});
    setValidationErrors({});
    setFileOriginalNames({});
  };

  // Handle cell input change
  const handleInputChange = (columnName: string, value: string) => {
    setNewRowData((prev) => ({ ...prev, [columnName]: value }));
    // Clear error on type
    if (validationErrors[columnName]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[columnName];
        return updated;
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (columnName: string, file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        [columnName]: 'File exceeds 5MB size limit'
      }));
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [columnName]: true }));
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[columnName];
      return copy;
    });

    try {
      const res = await uploadFile(file);
      if (res && res.file && res.file.id) {
        setNewRowData((prev) => ({ ...prev, [columnName]: res.file.id }));
        setFileOriginalNames((prev) => ({ ...prev, [columnName]: file.name }));
      } else {
        throw new Error('Upload returned invalid file reference');
      }
    } catch (err: any) {
      setValidationErrors((prev) => ({
        ...prev,
        [columnName]: err?.response?.data?.message || err.message || 'File upload failed'
      }));
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [columnName]: false }));
    }
  };

  // Handle file removal
  const handleRemoveFile = (columnName: string) => {
    setNewRowData((prev) => ({ ...prev, [columnName]: '' }));
    setFileOriginalNames((prev) => {
      const copy = { ...prev };
      delete copy[columnName];
      return copy;
    });
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[columnName];
      return copy;
    });
  };

  // Validate all columns before submit
  const validateRow = (): boolean => {
    const errors: Record<string, string> = {};
    const parsedPayload: Record<string, any> = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    columns.forEach((col) => {
      const meta = columnMetaMap[col];
      const rawValue = newRowData[col];
      const type = (meta?.type || 'String').toLowerCase();

      if (meta?.required && (rawValue === '' || rawValue === undefined || rawValue === null)) {
        errors[col] = `${formatColumnHeader(col)} is required`;
        return;
      }

      if (rawValue !== '' && rawValue !== undefined && rawValue !== null) {
        if (type === 'number') {
          const num = Number(rawValue);
          if (isNaN(num)) {
            errors[col] = `Must be a valid number`;
          } else {
            parsedPayload[col] = num;
          }
        } else if (type === 'date') {
          const dateVal = new Date(rawValue);
          if (isNaN(dateVal.getTime())) {
            errors[col] = `Must be a valid date`;
          } else if (dateVal > today) {
            errors[col] = `Date cannot be in the future`;
          } else {
            parsedPayload[col] = dateVal.toISOString();
          }
        } else if (type === 'boolean') {
          parsedPayload[col] = rawValue === 'true' || rawValue === true;
        } else {
          parsedPayload[col] = rawValue;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new row to backend
  const handleSaveRow = async () => {
    if (!validateRow() || !sheetName) return;

    setIsSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = { ...newRowData };

      // Ensure appropriate numeric/date types
      columns.forEach((col) => {
        const type = (columnMetaMap[col]?.type || 'String').toLowerCase();
        if (payload[col] !== '' && payload[col] !== undefined) {
          if (type === 'number') payload[col] = Number(payload[col]);
          if (type === 'date') payload[col] = new Date(payload[col]).toISOString();
        }
      });

      // Assign month_id from ReportContext useReport()
      if (monthId) {
        payload.month_id = monthId;
      } else {
        setError('No active month selected from the Report Context. Please select a month.');
        setIsSaving(false);
        return;
      }

      // Assign created_by as 'User' (will be replaced by OAuth/JWT user after auth setup)
      payload.created_by = 'User';

      if (editingRowId) {
        // Update existing row
        const res = await updateSheetEntry(sheetName, editingRowId, payload);
        const updatedItem = res.data || { ...payload, _id: editingRowId };

        setRows((prev) => prev.map((r) => (r._id === editingRowId ? updatedItem : r)));
      } else {
        // Create new row
        const res = await createSheetEntry(sheetName, payload);
        const createdItem = res.data || payload;

        setRows((prev) => [...prev, createdItem]);
      }

      setIsAddingRow(false);
      setEditingRowId(null);
      setNewRowData({});
      setFileOriginalNames({});
      triggerRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save row');
    } finally {
      setIsSaving(false);
    }
  };

  if (!sheetName) {
    return (
      <div className="mainpage-container">
        <div className="mainpage-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <h3>No Sheet Selected</h3>
          <p>Please select a sheet from the sidebar on the left to view data entries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mainpage-container">
      {/* Top action/info bar */}
      <div className="mainpage-header">
        <div className="mainpage-header-info">
          <h2 className="mainpage-title">{formatColumnHeader(sheetName)}</h2>
          {currentMonthName && (
            <span className="mainpage-badge">{currentMonthName}</span>
          )}
          <span className="mainpage-badge">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button className="mainpage-refresh-btn" onClick={loadData} title="Refresh Table">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && <div className="mainpage-status-error">{error}</div>}

      {/* Main Table View */}
      <div className="mainpage-table-wrapper">
        <div className="mainpage-card">
          <table className="mainpage-table">
            <thead>
              <tr>
                <th className="mainpage-actions-th">Actions</th>
                {columns.map((col) => (
                  <th key={col}>{formatColumnHeader(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="mainpage-status-loading">
                    Loading sheet data...
                  </td>
                </tr>
              ) : (
                <>
                  {rows.length > 0 ? (
                    rows.map((row, idx) => {
                      const isCurrentlyEditing = isAddingRow && editingRowId === row._id;

                      // If this row is being edited inline
                      if (isCurrentlyEditing) {
                        return (
                          <tr key={row._id || idx} className="mainpage-new-row">
                            <td className="mainpage-row-actions-cell">
                              <span className="mainpage-editing-badge">Editing</span>
                            </td>
                            {columns.map((col) => {
                              const meta = columnMetaMap[col];
                              const type = (meta?.type || 'String').toLowerCase();
                              const isFile = isFileField(col);
                              const hasError = !!validationErrors[col];

                              if (isFile) {
                                const hasUploadedFile = !!newRowData[col];
                                return (
                                  <td key={col}>
                                    <div className="mainpage-file-input-wrapper">
                                      {!hasUploadedFile ? (
                                        <label className="mainpage-file-label">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                          </svg>
                                          {uploadingFiles[col] ? 'Uploading...' : 'Choose File'}
                                          <input
                                            type="file"
                                            className="mainpage-file-hidden"
                                            disabled={uploadingFiles[col]}
                                            onChange={(e) => {
                                              if (e.target.files && e.target.files[0]) {
                                                handleFileUpload(col, e.target.files[0]);
                                              }
                                            }}
                                          />
                                        </label>
                                      ) : (
                                        <div className="mainpage-file-selected-row">
                                          <span className="mainpage-file-uploaded-tag" title={fileOriginalNames[col] || 'Uploaded File'}>
                                            ✓ {fileOriginalNames[col] || 'File Attached'}
                                          </span>
                                          <button
                                            type="button"
                                            className="mainpage-file-remove-btn"
                                            onClick={() => handleRemoveFile(col)}
                                            title="Remove selected file"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                      {hasError && (
                                        <span className="mainpage-input-error-msg">
                                          {validationErrors[col]}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              }

                              let inputType = 'text';
                              let maxAttr: string | undefined = undefined;
                              if (type === 'number') inputType = 'number';
                              if (type === 'date') {
                                inputType = 'date';
                                maxAttr = new Date().toISOString().split('T')[0];
                              }

                              return (
                                <td key={col}>
                                  <input
                                    type={inputType}
                                    max={maxAttr}
                                    className={`mainpage-input ${hasError ? 'has-error' : ''}`}
                                    placeholder={`Enter ${formatColumnHeader(col)}`}
                                    value={newRowData[col] ?? ''}
                                    onChange={(e) => handleInputChange(col, e.target.value)}
                                  />
                                  {hasError && (
                                    <span className="mainpage-input-error-msg">
                                      {validationErrors[col]}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }

                      return (
                        <tr key={row._id || idx} className="mainpage-data-row">
                          {/* Hover Actions Cell at the Left End */}
                          <td className="mainpage-row-actions-cell">
                            <div className="mainpage-row-actions-btn-group">
                              <button
                                type="button"
                                className="mainpage-row-action-btn edit-btn"
                                onClick={() => handleStartEditRow(row)}
                                title="Edit this row"
                                aria-label="Edit row"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="mainpage-row-action-btn delete-btn"
                                onClick={() => handleDeleteRow(row._id)}
                                title="Delete this row"
                                aria-label="Delete row"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </td>

                          {columns.map((col) => {
                            const val = row[col];
                            const isFile = isFileField(col);

                            if (isFile && val && typeof val === 'string' && val.length >= 12) {
                              return (
                                <td key={col}>
                                  <a
                                    href={getFileUrl(val)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mainpage-preview-btn"
                                    title="Open file in new tab"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Preview
                                  </a>
                                </td>
                              );
                            }

                            return (
                              <td key={col} title={formatCellValue(val, col)}>
                                {formatCellValue(val, col)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    !isAddingRow && (
                      <tr>
                        <td colSpan={columns.length + 1} className="mainpage-no-rows">
                          No rows available
                        </td>
                      </tr>
                    )
                  )}

                  {/* Inline New Row Input Editor (When adding a brand new row) */}
                  {isAddingRow && !editingRowId && (
                    <tr className="mainpage-new-row">
                      <td className="mainpage-row-actions-cell">
                        <span className="mainpage-editing-badge">New</span>
                      </td>
                      {columns.map((col) => {
                        const meta = columnMetaMap[col];
                        const type = (meta?.type || 'String').toLowerCase();
                        const isFile = isFileField(col);
                        const hasError = !!validationErrors[col];

                        if (isFile) {
                          const hasUploadedFile = !!newRowData[col];
                          return (
                            <td key={col}>
                              <div className="mainpage-file-input-wrapper">
                                {!hasUploadedFile ? (
                                  <label className="mainpage-file-label">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    {uploadingFiles[col] ? 'Uploading...' : 'Choose File'}
                                    <input
                                      type="file"
                                      className="mainpage-file-hidden"
                                      disabled={uploadingFiles[col]}
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleFileUpload(col, e.target.files[0]);
                                        }
                                      }}
                                    />
                                  </label>
                                ) : (
                                  <div className="mainpage-file-selected-row">
                                    <span className="mainpage-file-uploaded-tag" title={fileOriginalNames[col] || 'Uploaded File'}>
                                      ✓ {fileOriginalNames[col] || 'File Attached'}
                                    </span>
                                    <button
                                      type="button"
                                      className="mainpage-file-remove-btn"
                                      onClick={() => handleRemoveFile(col)}
                                      title="Remove selected file"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                                {hasError && (
                                  <span className="mainpage-input-error-msg">
                                    {validationErrors[col]}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }

                        let inputType = 'text';
                        let maxAttr: string | undefined = undefined;
                        if (type === 'number') inputType = 'number';
                        if (type === 'date') {
                          inputType = 'date';
                          maxAttr = new Date().toISOString().split('T')[0];
                        }

                        return (
                          <td key={col}>
                            <input
                              type={inputType}
                              max={maxAttr}
                              className={`mainpage-input ${hasError ? 'has-error' : ''}`}
                              placeholder={`Enter ${formatColumnHeader(col)}`}
                              value={newRowData[col] ?? ''}
                              onChange={(e) => handleInputChange(col, e.target.value)}
                            />
                            {hasError && (
                              <span className="mainpage-input-error-msg">
                                {validationErrors[col]}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Add / OK Action Button Row */}
                  <tr className="mainpage-action-row">
                    <td colSpan={columns.length + 1}>
                      <div className="mainpage-center-btn-container">
                        {isAddingRow ? (
                          <>
                            <button
                              className="mainpage-ok-btn"
                              onClick={handleSaveRow}
                              disabled={isSaving || Object.values(uploadingFiles).some(Boolean)}
                              title={editingRowId ? "Update row" : "Save new row"}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {isSaving ? 'Saving...' : (editingRowId ? 'Update' : 'OK')}
                            </button>
                            <button
                              className="mainpage-cancel-btn"
                              onClick={handleCancelAddRow}
                              disabled={isSaving}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="mainpage-add-btn"
                            onClick={handleOpenAddRow}
                            title="Add new row"
                            aria-label="Add Row"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Mainpage;

