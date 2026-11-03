import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/apiClient';
import { getSocket } from '../../services/socketService';
import { useReport } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import { ColumnDefinition, SheetEntry, ActiveCollaborator } from '../../types';
import SheetEntryModal from '../modals/SheetEntryModal';
import ManageAccessModal from '../modals/ManageAccessModal';
import { Plus, Users, RefreshCw, Edit2, Trash2, ShieldAlert, Check, Clock, Undo, Redo, Lock, Key } from 'lucide-react';

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

  // 1. Fetch Sheet Schema & Data
  const loadSheetData = async () => {
    if (!selectedMonth) return;
    try {
      setLoading(true);
      const [colsRes, entriesRes, unlockRes] = await Promise.all([
        api.get(`/sheets/${sheetKey}/columns`),
        api.get(`/sheets/${sheetKey}/entries`, {
          params: { monthId: selectedMonth._id, staffId: sharedOwnerId }
        }),
        api.get(`/unlock/${sheetKey}/status`, {
          params: { monthId: selectedMonth._id, staffId: sharedOwnerId }
        })
      ]);

      if (colsRes.data?.success) setColumns(colsRes.data.columns || []);
      if (entriesRes.data?.success) setEntries(entriesRes.data.entries || []);
      if (unlockRes.data?.success) setUnlockInfo(unlockRes.data);
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
      const mutations = draftEntries.map((e) => ({
        id: e.id || e._id,
        version: e.version,
        data: e.data
      }));

      await api.post(
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
      setSyncStatus('SAVED');
      setTimeout(() => setSyncStatus('IDLE'), 3000);
    } catch (err: any) {
      setSyncStatus('ERROR');
      console.error('Batch auto-save error:', err);
    }
  };

  // 4. Inline Cell Edit with 2.5s Debounced Auto-Save
  const handleCellEdit = (entryId: string, fieldKey: string, newValue: any) => {
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

          {/* Manage Access Button */}
          {!sharedOwnerId && (
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

          {/* Add Entry Button */}
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
              Entries created for this academic criterion will appear here.
            </div>
            {!effectiveIsLocked && (
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
            )}
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '12px',
              border: '1px solid #e2e8f0'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', width: '80px', color: '#475569', fontWeight: 700 }}>Actions</th>
                <th style={{ padding: '10px 12px', width: '50px', color: '#475569', fontWeight: 700 }}>#</th>
                {columns.map((col) => (
                  <th key={col.fieldKey} style={{ padding: '10px 12px', color: '#475569', fontWeight: 700, minWidth: '140px' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const rowId = entry.id || entry._id!;
                const peerHighlight = highlightedRows[rowId];

                return (
                  <tr
                    key={rowId}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: peerHighlight ? `${peerHighlight.color}15` : '#ffffff',
                      borderLeft: peerHighlight ? `4px solid ${peerHighlight.color}` : '4px solid transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {/* Action Buttons */}
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsEntryModalOpen(true);
                          }}
                          disabled={effectiveIsLocked}
                          title="Edit Entry"
                          style={{ color: '#2563eb', cursor: effectiveIsLocked ? 'not-allowed' : 'pointer' }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(rowId)}
                          disabled={effectiveIsLocked}
                          title="Delete Entry"
                          style={{ color: '#dc2626', cursor: effectiveIsLocked ? 'not-allowed' : 'pointer' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                    {/* S.No */}
                    <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>

                    {/* Data Cells (Editable inline with auto-save) */}
                    {columns.map((col) => {
                      const val = entry.data ? entry.data[col.fieldKey] ?? '' : '';
                      return (
                        <td key={col.fieldKey} style={{ padding: '6px 10px' }}>
                          <input
                            type={col.type === 'Number' ? 'number' : 'text'}
                            value={val}
                            disabled={effectiveIsLocked}
                            onFocus={() => {
                              getSocket().emit('row_focus', { rowId });
                            }}
                            onBlur={() => {
                              getSocket().emit('row_blur', { rowId });
                            }}
                            onChange={(e) => handleCellEdit(rowId, col.fieldKey, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid transparent',
                              backgroundColor: 'transparent',
                              fontSize: '12px',
                              color: '#1e2842',
                              outline: 'none',
                              transition: 'border-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!effectiveIsLocked) (e.target as HTMLElement).style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              if (document.activeElement !== e.target) {
                                (e.target as HTMLElement).style.borderColor = 'transparent';
                              }
                            }}
                          />
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
      />
    </div>
  );
}
