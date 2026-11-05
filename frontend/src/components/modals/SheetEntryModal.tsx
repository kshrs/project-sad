import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { ColumnDefinition } from '../../types';
import { X, Check, Upload, AlertCircle, FileText, Trash2, Loader2, Link2 } from 'lucide-react';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  columns: ColumnDefinition[];
  initialData?: Record<string, any>;
  title: string;
}

export default function SheetEntryModal({
  isOpen,
  onClose,
  onSave,
  columns,
  initialData,
  title
}: EntryModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fileDetails, setFileDetails] = useState<Record<string, { id: string; name: string }>>({});
  const [fileMode, setFileMode] = useState<Record<string, 'UPLOAD' | 'LINK'>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Populate any existing file fields
      const files: Record<string, { id: string; name: string }> = {};
      const modes: Record<string, 'UPLOAD' | 'LINK'> = {};
      columns.forEach((c) => {
        if (c.type === 'File' && initialData[c.fieldKey]) {
          const val = String(initialData[c.fieldKey]);
          const isUrl = val.startsWith('http://') || val.startsWith('https://');
          modes[c.fieldKey] = isUrl ? 'LINK' : 'UPLOAD';
          files[c.fieldKey] = {
            id: val,
            name: isUrl ? val : 'Attached Proof Document'
          };
        }
      });
      setFileDetails(files);
      setFileMode(modes);
    } else {
      setFormData({});
      setFileDetails({});
      setFileMode({});
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldKey];
        return copy;
      });
    }
  };

  const handleFileUpload = async (fieldKey: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    try {
      setUploadingField(fieldKey);
      const data = new FormData();
      data.append('file', file);

      // Do not manually set 'Content-Type': 'multipart/form-data' without the boundary;
      // letting the browser set it automatically sets multipart/form-data; boundary=...
      const res = await api.post('/files/upload', data, {
        headers: { 'Content-Type': undefined }
      });

      if (res.data?.success && res.data?.file) {
        const uploadedFile = res.data.file;
        setFormData((prev) => ({ ...prev, [fieldKey]: uploadedFile.id }));
        setFileDetails((prev) => ({
          ...prev,
          [fieldKey]: { id: uploadedFile.id, name: uploadedFile.originalname }
        }));
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      alert(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveFile = (fieldKey: string) => {
    setFormData((prev) => {
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
    setFileDetails((prev) => {
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields (excluding automatic serial number)
    const newErrors: Record<string, string> = {};
    columns.forEach((col) => {
      const key = col.fieldKey.toLowerCase();
      if (key === 's_no' || key === 'sno' || key === 'sl_no' || key === 'serial_no') return;
      if (col.required && !formData[col.fieldKey]) {
        newErrors[col.fieldKey] = `${col.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e2842' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}
          >
            {columns
              .filter((col) => {
                const key = col.fieldKey.toLowerCase();
                return key !== 's_no' && key !== 'sno' && key !== 'sl_no' && key !== 'serial_no';
              })
              .map((col) => {
                const hasError = !!errors[col.fieldKey];
                const value = formData[col.fieldKey] || '';
                const attachedFile = fileDetails[col.fieldKey];
                const isUploading = uploadingField === col.fieldKey;

                return (
                  <div key={col.fieldKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      {col.label} {col.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>

                    {col.type === 'Date' ? (
                      <input
                        type="date"
                        value={value ? String(value).split('T')[0] : ''}
                        onChange={(e) => handleChange(col.fieldKey, e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${hasError ? '#dc2626' : '#cbd5e1'}`,
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    ) : col.type === 'Number' ? (
                      <input
                        type="number"
                        placeholder={`Enter ${col.label.toLowerCase()}`}
                        value={value}
                        onChange={(e) => handleChange(col.fieldKey, e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${hasError ? '#dc2626' : '#cbd5e1'}`,
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    ) : col.type === 'File' ? (
                      <div>
                        {attachedFile ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                              {String(attachedFile.id).startsWith('http') ? (
                                <Link2 size={16} color="#2563eb" />
                              ) : (
                                <FileText size={16} color="#16a34a" />
                              )}
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: String(attachedFile.id).startsWith('http') ? '#1e40af' : '#166534',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {attachedFile.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(col.fieldKey)}
                              style={{ color: '#dc2626', padding: '2px', cursor: 'pointer' }}
                              title="Remove Proof"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            {/* Mode toggle */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setFileMode((prev) => ({ ...prev, [col.fieldKey]: 'UPLOAD' }))}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  backgroundColor: (fileMode[col.fieldKey] || 'UPLOAD') === 'UPLOAD' ? '#1e2842' : '#f1f5f9',
                                  color: (fileMode[col.fieldKey] || 'UPLOAD') === 'UPLOAD' ? '#ffffff' : '#475569',
                                  border: '1px solid #cbd5e1'
                                }}
                              >
                                Upload Document
                              </button>
                              <button
                                type="button"
                                onClick={() => setFileMode((prev) => ({ ...prev, [col.fieldKey]: 'LINK' }))}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  backgroundColor: fileMode[col.fieldKey] === 'LINK' ? '#1e2842' : '#f1f5f9',
                                  color: fileMode[col.fieldKey] === 'LINK' ? '#ffffff' : '#475569',
                                  border: '1px solid #cbd5e1'
                                }}
                              >
                                Web / OneDrive Link
                              </button>
                            </div>

                            {fileMode[col.fieldKey] === 'LINK' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  type="url"
                                  placeholder="https://kumaragurudtsteam-my.sharepoint.com/... or OneDrive URL"
                                  value={value || ''}
                                  onChange={(e) => {
                                    const linkVal = e.target.value;
                                    handleChange(col.fieldKey, linkVal);
                                    if (linkVal) {
                                      setFileDetails((prev) => ({
                                        ...prev,
                                        [col.fieldKey]: { id: linkVal, name: linkVal }
                                      }));
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    border: `1px solid ${hasError ? '#dc2626' : '#cbd5e1'}`,
                                    fontSize: '12px',
                                    outline: 'none'
                                  }}
                                />
                              </div>
                            ) : (
                              <label
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: `1px dashed ${hasError ? '#dc2626' : '#cbd5e1'}`,
                                  backgroundColor: '#f8fafc',
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  color: '#64748b',
                                  cursor: isUploading ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleFileUpload(col.fieldKey, e.target.files[0]);
                                    }
                                  }}
                                  style={{ display: 'none' }}
                                />
                                {isUploading ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}>
                                    <Loader2 size={16} className="spin" /> Uploading to server...
                                  </div>
                                ) : (
                                  <>
                                    <Upload size={18} style={{ margin: '0 auto 4px', display: 'block', color: '#94a3b8' }} />
                                    <span>Click to Upload Proof (PDF/Image &le; 5MB)</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={`Enter ${col.label.toLowerCase()}`}
                        value={value}
                        onChange={(e) => handleChange(col.fieldKey, e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${hasError ? '#dc2626' : '#cbd5e1'}`,
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    )}

                    {hasError && (
                      <span style={{ fontSize: '11px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} /> {errors[col.fieldKey]}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!uploadingField}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                backgroundColor: '#1e2842',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              <Check size={16} /> {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
