import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/apiClient';
import { getSocket } from '../../services/socketService';
import { useReport } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnDefinition, SheetEntry, ActiveCollaborator } from '../../types';
import SheetEntryModal from '../modals/SheetEntryModal';
import ManageAccessModal from '../modals/ManageAccessModal';
import {
  Plus,
  Users,
  RefreshCw,
  Edit2,
  Trash2,
  ShieldAlert,
  Check,
  Clock,
  Undo,
  Redo,
  Lock,
  Key,
  FileText,
  ExternalLink,
  Table,
  Columns,
  Rows
} from 'lucide-react';

interface SheetTableProps {
  sheetKey: string;
  sharedOwnerId?: string;
}

export default function SheetTable({ sheetKey, sharedOwnerId }: SheetTableProps) {
  const { selectedMonth, isMonthLocked, triggerRefresh } = useReport();
  const { user } = useAuth();

  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [entries, setEntries] = useState<SheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetPermissions, setSheetPermissions] = useState<{
    canCreate: boolean;
    canEditOwn: boolean;
    canDeleteOwn: boolean;
    canEditOthers: boolean;
    canDeleteOthers: boolean;
    isReadOnly: boolean;
  }>({
    canCreate: true,
    canEditOwn: true,
    canDeleteOwn: true,
    canEditOthers: true,
    canDeleteOthers: true,
    isReadOnly: false
  });

  // Auto-Save State Machine: 'IDLE' | 'DIRTY' | 'SYNCING' | 'SAVED' | 'ERROR'
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'DIRTY' | 'SYNCING' | 'SAVED' | 'ERROR'>('IDLE');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Undo / Redo Stack (capped at 50, local draft edits)
  const [undoStack, setUndoStack] = useState<SheetEntry[][]>([]);
  const [redoStack, setRedoStack] = useState<SheetEntry[][]>([]);

  // Real-time Collaborators & Row Highlights
  const [collaborators, setCollaborators] = useState<ActiveCollaborator[]>([]);
  const [highlightedRows, setHighlightedRows] = useState<Record<string, { displayName: string; color: string }>>({});

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SheetEntry | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // 24-hr Unlock state
  const [unlockInfo, setUnlockInfo] = useState<{ isUnlocked: boolean; remainingUnlocks: number } | null>(null);
  const [delegationCount, setDelegationCount] = useState<number>(0);

  // Excel Grid selection & fill-drag state
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  const [isMouseDownSelect, setIsMouseDownSelect] = useState(false);

  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [dragSource, setDragSource] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [dragCurrentRow, setDragCurrentRow] = useState<number | null>(null);

  // Clean data columns (filtering out redundant s_no)
  const dataColumns = columns.filter((col) => {
    const key = col.fieldKey.toLowerCase();
    return key !== 's_no' && key !== 'sno' && key !== 'sl_no' && key !== 'serial_no';
  });

  // Check if current user can edit a specific row
  const checkCanEditRow = (entry: SheetEntry): boolean => {
    if (effectiveIsLocked) return false;
    if (sheetPermissions.isReadOnly) return false;
    if (user?.role === 'ADMIN' || user?.role === 'COORDINATOR') return true;

    const currentUserId = user?.id || user?._id;
    const isOwnerOfSheet = !sharedOwnerId || sharedOwnerId === currentUserId;
    if (isOwnerOfSheet) return true;

    // It's a shared sheet
    const entryCreatorId = entry.createdBy ? (typeof entry.createdBy === 'object' ? (entry.createdBy as any)._id || (entry.createdBy as any).id : entry.createdBy).toString() : '';
    const isEntryCreator = entryCreatorId && currentUserId && entryCreatorId === currentUserId.toString();

    if (isEntryCreator) {
      return sheetPermissions.canEditOwn;
    }
    return sheetPermissions.canEditOthers;
  };

  // Check if current user can delete a specific row
  const checkCanDeleteRow = (entry: SheetEntry): boolean => {
    if (effectiveIsLocked) return false;
    if (sheetPermissions.isReadOnly) return false;
    if (user?.role === 'ADMIN' || user?.role === 'COORDINATOR') return true;

    const currentUserId = user?.id || user?._id;
    const isOwnerOfSheet = !sharedOwnerId || sharedOwnerId === currentUserId;
    if (isOwnerOfSheet) return true;

    const entryCreatorId = entry.createdBy ? (typeof entry.createdBy === 'object' ? (entry.createdBy as any)._id || (entry.createdBy as any).id : entry.createdBy).toString() : '';
    const isEntryCreator = entryCreatorId && currentUserId && entryCreatorId === currentUserId.toString();

    if (isEntryCreator) {
      return sheetPermissions.canDeleteOwn;
    }
    return sheetPermissions.canDeleteOthers;
  };

  // 1. Fetch Sheet Schema & Data
  const loadSheetData = async () => {
    if (!selectedMonth) return;
    try {
      setLoading(true);
      const calls: Promise<any>[] = [
        api.get(`/sheets/${sheetKey}/columns`),
        api.get(`/sheets/${sheetKey}/entries`, {
          params: { monthId: selectedMonth._id, staffId: sharedOwnerId }
        }),
        api.get(`/unlock/${sheetKey}/status`, {
          params: { monthId: selectedMonth._id, staffId: sharedOwnerId }
        })
      ];

      if (user?.role === 'ADMIN' || user?.role === 'COORDINATOR') {
        calls.push(
          api.get(`/share/${sheetKey}`, {
            params: { monthId: selectedMonth._id, staffId: sharedOwnerId }
          })
        );
      }

      const [colsRes, entriesRes, unlockRes, sharesRes] = await Promise.all(calls);

      if (colsRes.data?.success) setColumns(colsRes.data.columns || []);
      if (entriesRes.data?.success) {
        setEntries(entriesRes.data.entries || []);
        if (entriesRes.data.permissions) {
          setSheetPermissions(entriesRes.data.permissions);
        } else {
          setSheetPermissions({
            canCreate: true,
            canEditOwn: true,
            canDeleteOwn: true,
            canEditOthers: true,
            canDeleteOthers: true,
            isReadOnly: false
          });
        }
      }
      if (unlockRes.data?.success) setUnlockInfo(unlockRes.data);
      if (sharesRes?.data?.success) {
        setDelegationCount(sharesRes.data.shares?.length || 0);
      }
    } catch (err: any) {
      console.error('Failed to load sheet data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheetData();
  }, [sheetKey, selectedMonth?._id, sharedOwnerId]);

  // 2. Real-Time Socket.io Presence & Row Highlights
  useEffect(() => {
    if (!selectedMonth || !user) return;

    const socket = getSocket();
    const effectiveOwnerId = sharedOwnerId || user.id;

    socket.emit('join_sheet', {
      sheetKey,
      monthId: selectedMonth._id,
      ownerId: effectiveOwnerId
    });

    socket.on('collaborators_update', (list: ActiveCollaborator[]) => {
      setCollaborators(list.filter((c) => c.userId !== user.id));
    });

    socket.on('row_highlight', ({ rowId, user: peerUser }) => {
      setHighlightedRows((prev) => ({ ...prev, [rowId]: peerUser }));
    });

    socket.on('row_unhighlight', ({ rowId }) => {
      setHighlightedRows((prev) => {
        const copy = { ...prev };
        delete copy[rowId];
        return copy;
      });
    });

    return () => {
      socket.off('collaborators_update');
      socket.off('row_highlight');
      socket.off('row_unhighlight');
    };
  }, [sheetKey, selectedMonth?._id, sharedOwnerId, user?.id]);

  // 3. Flush Unsaved Edits immediately on sheet switch or unmount
  const flushSave = async (draftEntries: SheetEntry[]) => {
    if (!selectedMonth) return;
    try {
      setSyncStatus('SYNCING');
      const mutations = draftEntries.map((e) => {
        const rawId = e.id || e._id;
        const isDraft = typeof rawId === 'string' && rawId.startsWith('draft_');
        return {
          id: isDraft ? null : rawId,
          version: isDraft ? undefined : e.version,
          data: e.data
        };
      });

      const res = await api.post(
        `/sheets/${sheetKey}/entries/batch-save`,
        {
          monthId: selectedMonth._id,
          targetOwnerId: sharedOwnerId,
          mutations
        },
        {
          headers: { 'X-Idempotency-Key': crypto.randomUUID() }
        }
      );
      if (res.data?.items) {
        // Update local entries with newly assigned IDs and versions from server
        setEntries((prev) => {
          const map = new Map();
          res.data.items.forEach((item: any) => {
            if (item.id || item._id) map.set(item.id || item._id, item);
          });
          return prev.map((e) => {
            const serverItem = map.get(e.id || e._id);
            if (serverItem) {
              return { ...e, ...serverItem };
            }
            return e;
          });
        });
      }
      setSyncStatus('SAVED');
      setTimeout(() => setSyncStatus('IDLE'), 3000);
      triggerRefresh();
    } catch (err: any) {
      setSyncStatus('ERROR');
      console.error('Batch auto-save error:', err);
    }
  };

  // Add an empty row for Excel-like quick direct entry
  const handleAddQuickRow = () => {
    if (effectiveIsLocked || !sheetPermissions.canCreate) return;
    setUndoStack((prev) => [...prev.slice(-49), entries]);
    setRedoStack([]);

    const newRowId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: SheetEntry = {
      id: newRowId,
      _id: newRowId,
      sheetId: '',
      sheetKey,
      monthId: selectedMonth?._id || '',
      ownerId: sharedOwnerId || user?.id || '',
      createdBy: user?.id || '',
      version: 0,
      data: {}
    };

    const nextEntries = [...entries, newEntry];
    setEntries(nextEntries);
    setSelectedCell({ rowIdx: nextEntries.length - 1, colKey: dataColumns[0]?.fieldKey || '' });
    setEditingCell({ rowIdx: nextEntries.length - 1, colKey: dataColumns[0]?.fieldKey || '' });
    setSyncStatus('DIRTY');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      flushSave(nextEntries);
    }, 2500);
  };

  // Excel Drag-to-Fill Series or Copy Logic
  const handleExecuteFill = (sourceRowIdx: number, targetRowIdx: number, colKey: string) => {
    if (sourceRowIdx === targetRowIdx) return;
    const startIdx = Math.min(sourceRowIdx, targetRowIdx);
    const endIdx = Math.max(sourceRowIdx, targetRowIdx);

    const sourceEntry = entries[sourceRowIdx];
    if (!sourceEntry) return;

    const sourceVal = sourceEntry.data ? sourceEntry.data[colKey] : '';
    const colDef = dataColumns.find((c) => c.fieldKey === colKey);
    const isDate = colDef?.type === 'Date';

    // Parse source date if applicable
    let baseDate: Date | null = null;
    if (isDate && sourceVal) {
      const d = new Date(sourceVal);
      if (!isNaN(d.getTime())) baseDate = d;
    }

    setUndoStack((prev) => [...prev.slice(-49), entries]);
    setRedoStack([]);

    const updated = entries.map((entry, idx) => {
      if (idx >= startIdx && idx <= endIdx && idx !== sourceRowIdx) {
        // Enforce row-level edit permissions during drag-fill
        if (!checkCanEditRow(entry)) {
          return entry;
        }

        let fillVal = sourceVal;

        if (baseDate) {
          // Auto-increment date per row offset (Excel fill behavior)
          const offsetDays = idx - sourceRowIdx;
          const incremented = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
          fillVal = incremented.toISOString().split('T')[0];
        }

        return {
          ...entry,
          data: {
            ...entry.data,
            [colKey]: fillVal
          }
        };
      }
      return entry;
    });

    setEntries(updated);
    setSyncStatus('DIRTY');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      flushSave(updated);
    }, 2500);
  };

  // Global mouse up for ending drag fill and range selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingFill && dragSource && dragCurrentRow !== null) {
        handleExecuteFill(dragSource.rowIdx, dragCurrentRow, dragSource.colKey);
      }
      setIsDraggingFill(false);
      setDragSource(null);
      setDragCurrentRow(null);
      setIsMouseDownSelect(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDraggingFill, dragSource, dragCurrentRow, isMouseDownSelect, entries]);

  // Keyboard navigation across cells
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || editingCell) return;

      const { rowIdx, colKey } = selectedCell;
      const colIdx = dataColumns.findIndex((c) => c.fieldKey === colKey);
      if (colIdx === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rowIdx < entries.length - 1) {
          const nextRow = rowIdx + 1;
          setSelectedCell({ rowIdx: nextRow, colKey });
          setSelectionRange({ startRow: nextRow, startCol: colIdx, endRow: nextRow, endCol: colIdx });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIdx > 0) {
          const prevRow = rowIdx - 1;
          setSelectedCell({ rowIdx: prevRow, colKey });
          setSelectionRange({ startRow: prevRow, startCol: colIdx, endRow: prevRow, endCol: colIdx });
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        if (colIdx < dataColumns.length - 1) {
          const nextColKey = dataColumns[colIdx + 1].fieldKey;
          setSelectedCell({ rowIdx, colKey: nextColKey });
          setSelectionRange({ startRow: rowIdx, startCol: colIdx + 1, endRow: rowIdx, endCol: colIdx + 1 });
        } else if (rowIdx < entries.length - 1) {
          const nextRow = rowIdx + 1;
          setSelectedCell({ rowIdx: nextRow, colKey: dataColumns[0].fieldKey });
          setSelectionRange({ startRow: nextRow, startCol: 0, endRow: nextRow, endCol: 0 });
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (colIdx > 0) {
          const prevColKey = dataColumns[colIdx - 1].fieldKey;
          setSelectedCell({ rowIdx, colKey: prevColKey });
          setSelectionRange({ startRow: rowIdx, startCol: colIdx - 1, endRow: rowIdx, endCol: colIdx - 1 });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const entry = entries[rowIdx];
        if (entry && checkCanEditRow(entry)) {
          setEditingCell({ rowIdx, colKey });
        }
      } else if (e.key === 'Escape') {
        setSelectedCell(null);
        setSelectionRange(null);
        setEditingCell(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, entries.length, dataColumns]);

  // 4. Inline Cell Edit with 2.5s Debounced Auto-Save
  const handleCellEdit = (entryId: string, fieldKey: string, newValue: any) => {
    const targetEntry = entries.find((item) => (item.id || item._id) === entryId);
    if (!targetEntry || !checkCanEditRow(targetEntry)) {
      return;
    }

    // Push current snapshot to undo stack (max 50)
    setUndoStack((prev) => [...prev.slice(-49), entries]);
    setRedoStack([]);

    const updated = entries.map((item) => {
      if ((item.id || item._id) === entryId) {
        return {
          ...item,
          data: { ...item.data, [fieldKey]: newValue }
        };
      }
      return item;
    });

    setEntries(updated);
    setSyncStatus('DIRTY');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      flushSave(updated);
    }, 2500); // 2.5s debounced gap
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, entries]);
    setUndoStack((u) => u.slice(0, -1));
    setEntries(prev);
    flushSave(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, entries]);
    setRedoStack((r) => r.slice(0, -1));
    setEntries(next);
    flushSave(next);
  };

  // Save new or updated entry from modal
  const handleSaveModalEntry = async (data: Record<string, any>) => {
    if (!selectedMonth) return;
    if (editingEntry) {
      // Update entry
      handleCellEdit(editingEntry.id || editingEntry._id!, Object.keys(data)[0], data[Object.keys(data)[0]]);
      const updatedEntries = entries.map((e) =>
        (e.id || e._id) === (editingEntry.id || editingEntry._id) ? { ...e, data } : e
      );
      setEntries(updatedEntries);
      await flushSave(updatedEntries);
    } else {
      // Create new entry
      const mutations = [{ id: null, data }];
      await api.post(`/sheets/${sheetKey}/entries/batch-save`, {
        monthId: selectedMonth._id,
        targetOwnerId: sharedOwnerId,
        mutations
      });
      await loadSheetData();
      triggerRefresh();
    }
  };

  // Delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/sheets/entries/${entryId}`);
      setEntries((prev) => prev.filter((e) => (e.id || e._id) !== entryId));
      triggerRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  // Request / Grant 24h Month Unlock
  const handleGrantUnlock = async () => {
    if (!selectedMonth || !user) return;
    try {
      await api.post('/unlock', {
        sheetKey,
        monthId: selectedMonth._id,
        staffId: sharedOwnerId || user.id
      });
      alert('24-Hour Unlock Window Granted successfully!');
      await loadSheetData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to grant unlock window');
    }
  };

  const effectiveIsLocked = isMonthLocked && !unlockInfo?.isUnlocked && user?.role !== 'ADMIN';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--header-height))',
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e2842' }}>
            {sheetKey.replace(/([a-z])([A-Z])/g, '$1 $2')}
          </h2>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe'
            }}
          >
            {entries.length} {entries.length === 1 ? 'record' : 'records'}
          </span>

          {/* Auto-Save Status Badge */}
          {syncStatus === 'DIRTY' && (
            <span style={{ fontSize: '11px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Saving in 2.5s...
            </span>
          )}
          {syncStatus === 'SYNCING' && (
            <span style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={12} className="spin" /> Syncing with DB...
            </span>
          )}
          {syncStatus === 'SAVED' && (
            <span style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Saved ✓
            </span>
          )}

          {/* Active Peer Collaborators Pills */}
          {collaborators.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Active peers:</span>
              {collaborators.map((c) => (
                <span
                  key={c.userId}
                  title={c.email}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: c.color,
                    color: '#ffffff'
                  }}
                >
                  {c.displayName.split(' ')[0]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Undo / Redo Buttons */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              color: undoStack.length === 0 ? '#94a3b8' : '#334155',
              cursor: undoStack.length === 0 ? 'default' : 'pointer'
            }}
          >
            <Undo size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              color: redoStack.length === 0 ? '#94a3b8' : '#334155',
              cursor: redoStack.length === 0 ? 'default' : 'pointer'
            }}
          >
            <Redo size={14} />
          </button>

          {/* 24-hr Month Unlock Button (For Admin or Staff) */}
          {isMonthLocked && user?.role === 'ADMIN' && (
            <button
              onClick={handleGrantUnlock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              <Key size={13} /> Grant 24h Unlock ({unlockInfo?.remainingUnlocks || 0}/2 left)
            </button>
          )}

          {/* Manage Access Button (Available to Staff for their own sheets) */}
          {user?.role === 'STAFF' && (!sharedOwnerId || sharedOwnerId === user.id) && (
            <button
              onClick={() => setIsAccessModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#1e2842',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <Users size={14} /> Manage Access
            </button>
          )}

          {/* Admin Delegation Audit Button (Admin monitors staff delegation rules) */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsAccessModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: delegationCount > 0 ? '#eff6ff' : '#f8fafc',
                border: `1px solid ${delegationCount > 0 ? '#93c5fd' : '#cbd5e1'}`,
                color: delegationCount > 0 ? '#1d4ed8' : '#475569',
                fontSize: '12px',
                fontWeight: 600
              }}
              title="Monitor and govern active staff delegation rules"
            >
              <Users size={14} color={delegationCount > 0 ? '#2563eb' : '#64748b'} />
              <span>Audit Delegations</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: delegationCount > 0 ? '#2563eb' : '#e2e8f0',
                  color: delegationCount > 0 ? '#ffffff' : '#64748b'
                }}
              >
                {delegationCount}
              </span>
            </button>
          )}

          {/* Quick Add Row Button (Excel Grid Mode) */}
          {sheetPermissions.canCreate && !effectiveIsLocked && (
            <button
              onClick={handleAddQuickRow}
              title="Add a blank row directly in the spreadsheet (Ctrl+Enter)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Rows size={14} /> + Quick Row
            </button>
          )}

          {/* Add Entry Modal Button */}
          {sheetPermissions.canCreate && (
            <button
              onClick={() => {
                setEditingEntry(null);
                setIsEntryModalOpen(true);
              }}
              disabled={effectiveIsLocked}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: effectiveIsLocked ? '#94a3b8' : '#1e2842',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: effectiveIsLocked ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={14} /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Main Table Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Loading sheet schema and entries...
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed #e2e8f0',
              borderRadius: '8px',
              margin: '20px auto',
              maxWidth: '500px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              No entries recorded for this month
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              {effectiveIsLocked
                ? 'This month is locked for editing. No entries can be added or modified.'
                : 'Entries created for this academic criterion will appear here.'}
            </div>
            {!effectiveIsLocked ? (
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setIsEntryModalOpen(true);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#1e2842',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                + Create First Entry
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <Lock size={14} /> Locked for Editing
              </div>
            )}
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              userSelect: 'none'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 10px', width: '70px', color: '#475569', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>Actions</th>
                <th style={{ padding: '8px 10px', width: '45px', color: '#475569', fontWeight: 700, textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>#</th>
                {dataColumns.map((col) => (
                  <th
                    key={col.fieldKey}
                    style={{
                      padding: '8px 12px',
                      color: '#334155',
                      fontWeight: 700,
                      minWidth: '150px',
                      borderRight: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {col.label}
                      {col.required && (
                        <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '13px', lineHeight: 1 }} title="Required field">
                          *
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, rowIdx) => {
                const rowId = entry.id || entry._id!;
                const peerHighlight = highlightedRows[rowId];

                // Is this row inside the active drag-to-fill zone?
                const isRowInDrag =
                  isDraggingFill &&
                  dragSource &&
                  dragCurrentRow !== null &&
                  rowIdx >= Math.min(dragSource.rowIdx, dragCurrentRow) &&
                  rowIdx <= Math.max(dragSource.rowIdx, dragCurrentRow);

                return (
                  <tr
                    key={rowId}
                    onMouseEnter={() => {
                      if (isDraggingFill) {
                        setDragCurrentRow(rowIdx);
                      }
                    }}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: isRowInDrag
                        ? 'rgba(37, 99, 235, 0.08)'
                        : peerHighlight
                        ? `${peerHighlight.color}15`
                        : rowIdx % 2 === 0
                        ? '#ffffff'
                        : '#fafafa',
                      borderLeft: peerHighlight ? `4px solid ${peerHighlight.color}` : '4px solid transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Action Buttons */}
                    <td style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0' }}>
                      {(() => {
                        const canEditThisRow = checkCanEditRow(entry);
                        const canDeleteThisRow = checkCanDeleteRow(entry);

                        if (!canEditThisRow && !canDeleteThisRow) {
                          return <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>;
                        }

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {canEditThisRow && (
                              <button
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setIsEntryModalOpen(true);
                                }}
                                title="Edit Row in Modal"
                                style={{ color: '#2563eb', cursor: 'pointer', background: 'none', border: 'none', padding: '2px' }}
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {canDeleteThisRow && (
                              <button
                                onClick={() => handleDeleteEntry(rowId)}
                                title="Delete Row"
                                style={{ color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none', padding: '2px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Excel Row Header Number */}
                    <td
                      style={{
                        padding: '6px 8px',
                        color: '#64748b',
                        fontWeight: 600,
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        borderRight: '1px solid #e2e8f0',
                        fontSize: '11px'
                      }}
                    >
                      {rowIdx + 1}
                    </td>

                    {/* Data Cells (Full Excel-like Interactive Grid) */}
                    {dataColumns.map((col, colIdx) => {
                      const isSelected = selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === col.fieldKey;
                      const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === col.fieldKey;
                      const val = entry.data ? entry.data[col.fieldKey] ?? '' : '';

                      // Multi-cell range selection test
                      const isInRange =
                        selectionRange &&
                        rowIdx >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
                        rowIdx <= Math.max(selectionRange.startRow, selectionRange.endRow) &&
                        colIdx >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
                        colIdx <= Math.max(selectionRange.startCol, selectionRange.endCol);

                      const canEditThisRow = checkCanEditRow(entry);

                      const isFileCol = col.type === 'File';

                      if (isFileCol) {
                        const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
                        const fileHref = isUrl ? val : `${api.defaults.baseURL}/files/${val}`;
                        return (
                          <td
                            key={col.fieldKey}
                            style={{
                              padding: '6px 10px',
                              borderRight: '1px solid #e2e8f0',
                              userSelect: 'none'
                            }}
                          >
                            {val ? (
                              <a
                                href={fileHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: isUrl ? '#f0fdf4' : '#eff6ff',
                                  color: isUrl ? '#166534' : '#2563eb',
                                  border: `1px solid ${isUrl ? '#bbf7d0' : '#bfdbfe'}`,
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                              >
                                {isUrl ? <ExternalLink size={12} /> : <FileText size={12} />}
                                {isUrl ? 'Open Link' : 'View Proof'}
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>
                                No file
                              </span>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.fieldKey}
                          onMouseDown={(e) => {
                            if (isEditing) return;
                            // Prevent native browser text selection when clicking or dragging across cells
                            e.preventDefault();
                            setIsMouseDownSelect(true);
                            setSelectedCell({ rowIdx, colKey: col.fieldKey });
                            setSelectionRange({
                              startRow: rowIdx,
                              startCol: colIdx,
                              endRow: rowIdx,
                              endCol: colIdx
                            });
                          }}
                          onMouseEnter={() => {
                            if (isMouseDownSelect && selectionRange && !isDraggingFill) {
                              setSelectionRange((prev) =>
                                prev ? { ...prev, endRow: rowIdx, endCol: colIdx } : null
                              );
                            }
                          }}
                          onDoubleClick={() => {
                            if (canEditThisRow) {
                              setEditingCell({ rowIdx, colKey: col.fieldKey });
                            }
                          }}
                          style={{
                            padding: isEditing ? '0px' : '6px 10px',
                            color: '#1e2842',
                            fontSize: '12px',
                            borderRight: '1px solid #e2e8f0',
                            position: 'relative',
                            backgroundColor: isInRange
                              ? 'rgba(37, 99, 235, 0.08)'
                              : isSelected
                              ? 'rgba(37, 99, 235, 0.05)'
                              : undefined,
                            outline: isSelected ? '2px solid #2563eb' : isInRange ? '1px solid #93c5fd' : 'none',
                            outlineOffset: '-2px',
                            cursor: canEditThisRow ? 'cell' : 'default',
                            userSelect: isEditing ? 'text' : 'none'
                          }}
                        >
                          {isEditing ? (
                            <input
                              type={col.type === 'Date' ? 'date' : col.type === 'Number' ? 'number' : 'text'}
                              autoFocus
                              defaultValue={
                                col.type === 'Date' && val
                                  ? String(val).split('T')[0]
                                  : val
                              }
                              onBlur={(e) => {
                                handleCellEdit(rowId, col.fieldKey, e.target.value);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellEdit(rowId, col.fieldKey, (e.target as HTMLInputElement).value);
                                  setEditingCell(null);
                                  // Move to row below
                                  if (rowIdx < entries.length - 1) {
                                    setSelectedCell({ rowIdx: rowIdx + 1, colKey: col.fieldKey });
                                  }
                                } else if (e.key === 'Tab') {
                                  e.preventDefault();
                                  handleCellEdit(rowId, col.fieldKey, (e.target as HTMLInputElement).value);
                                  setEditingCell(null);
                                  const cIdx = dataColumns.findIndex((c) => c.fieldKey === col.fieldKey);
                                  if (cIdx < dataColumns.length - 1) {
                                    setSelectedCell({ rowIdx, colKey: dataColumns[cIdx + 1].fieldKey });
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                padding: '6px 10px',
                                border: '2px solid #2563eb',
                                outline: 'none',
                                fontSize: '12px',
                                boxSizing: 'border-box',
                                backgroundColor: '#ffffff',
                                color: '#1e2842',
                                userSelect: 'text'
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                minHeight: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                userSelect: 'none'
                              }}
                            >
                              {val !== undefined && val !== null && val !== '' ? (
                                col.type === 'Date' ? (
                                  new Date(val).toLocaleDateString('en-GB')
                                ) : (
                                  String(val)
                                )
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>—</span>
                              )}
                            </div>
                          )}

                          {/* Excel Fill Handle (Small bottom-right blue square) */}
                          {isSelected && canEditThisRow && !isEditing && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsDraggingFill(true);
                                setDragSource({ rowIdx, colKey: col.fieldKey });
                                setDragCurrentRow(rowIdx);
                              }}
                              title="Click and drag down to auto-fill cells and increment dates"
                              style={{
                                position: 'absolute',
                                right: '-1px',
                                bottom: '-1px',
                                width: '7px',
                                height: '7px',
                                backgroundColor: '#2563eb',
                                cursor: 'crosshair',
                                zIndex: 10,
                                border: '1px solid #ffffff'
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <SheetEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveModalEntry}
        columns={columns}
        initialData={editingEntry?.data}
        title={editingEntry ? 'Edit Entry' : 'Add New Entry'}
      />

      <ManageAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        sheetKey={sheetKey}
        monthId={selectedMonth?._id || ''}
        staffId={sharedOwnerId}
      />
    </div>
  );
}
