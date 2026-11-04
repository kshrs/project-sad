import React, { useState } from 'react';
import api from '../../services/apiClient';
import { ColumnDefinition } from '../../types';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface CreateSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SUB_DIR_OPTIONS: Record<string, string[]> = {
  FACULTY: [
    'Development & Training',
    'Courses & Teaching',
    'Publications & Review',
    'Achievements & Research',
    'Procurement & Finance',
    'General & Others'
  ],
  STUDENT: [
    'Activities & Events',
    'Academics & Research',
    'Progression & Support',
    'General & Others'
  ],
  RESEARCH: [
    'Publications',
    'Grants & Patents',
    'General & Others'
  ],
  OUTREACH: [
    'Alumni Network',
    'Industry & MOUs',
    'General & Others'
  ],
  GENERAL: [
    'Institutional Reports',
    'Department Activities',
    'General & Others'
  ]
};

export default function CreateSheetModal({ isOpen, onClose, onCreated }: CreateSheetModalProps) {
  const [sheetKey, setSheetKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState<'FACULTY' | 'STUDENT' | 'RESEARCH' | 'OUTREACH' | 'GENERAL'>('FACULTY');
  const [subDir, setSubDir] = useState<string>('Development & Training');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { fieldKey: 'title', label: 'Title / Activity Name', type: 'String', required: true },
    { fieldKey: 'date', label: 'Date', type: 'Date', required: false },
    { fieldKey: 'proof_file', label: 'Proof Document', type: 'File', required: false }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: 'FACULTY' | 'STUDENT' | 'RESEARCH' | 'OUTREACH' | 'GENERAL') => {
    setCategory(newCat);
    const available = SUB_DIR_OPTIONS[newCat] || ['General & Others'];
    setSubDir(available[0]);
  };

  const handleAddColumn = () => {
    setColumns((prev) => [
      ...prev,
      { fieldKey: `field_${Date.now()}`, label: 'New Column', type: 'String', required: false }
    ]);
  };

  const handleUpdateColumn = (index: number, field: Partial<ColumnDefinition>) => {
    setColumns((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...field };
      // Keep fieldKey camel/snake clean
      if (field.label) {
        copy[index].fieldKey = field.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      return copy;
    });
  };

  const handleRemoveColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Sheet display name is required');
      return;
    }

    const finalKey = sheetKey.trim() || displayName.replace(/[^a-zA-Z0-9]/g, '');

    try {
      setSubmitting(true);
      setError(null);
      await api.post('/sheets', {
        sheetKey: finalKey,
        displayName: displayName.trim(),
        category,
        subDir: subDir.trim(),
        columns,
        targetScope: 'ALL'
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sheet');
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
          maxWidth: '700px',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
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
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e2842' }}>Create & Publish New Criteria Sheet</h2>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Define a new academic achievement category published to all department staff.
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Sheet Display Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Industry Sponsored Projects"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Category (Primary Folder)
              </label>
              <select
                value={category}
                onChange={(e: any) => handleCategoryChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="FACULTY">Faculty Development</option>
                <option value="STUDENT">Student Achievements</option>
                <option value="RESEARCH">Research & Publications</option>
                <option value="OUTREACH">Outreach & Industry</option>
                <option value="GENERAL">General Criteria</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Sub-Directory (Sub-Folder)
              </label>
              <select
                value={subDir}
                onChange={(e) => setSubDir(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {(SUB_DIR_OPTIONS[category] || ['General & Others']).map((sd) => (
                  <option key={sd} value={sd}>
                    {sd}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Schema Columns ({columns.length})
              </label>
              <button
                type="button"
                onClick={handleAddColumn}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Column
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                >
                  <input
                    type="text"
                    value={col.label}
                    placeholder="Column Label"
                    onChange={(e) => handleUpdateColumn(idx, { label: e.target.value })}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />

                  <select
                    value={col.type}
                    onChange={(e: any) => handleUpdateColumn(idx, { type: e.target.value })}
                    style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="String">Text</option>
                    <option value="Number">Number</option>
                    <option value="Date">Date</option>
                    <option value="File">Proof Attachment (PDF/Img)</option>
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={col.required}
                      onChange={(e) => handleUpdateColumn(idx, { required: e.target.checked })}
                    />
                    Required
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(idx)}
                    disabled={columns.length <= 1}
                    style={{ color: '#dc2626', opacity: columns.length <= 1 ? 0.3 : 1, cursor: columns.length <= 1 ? 'default' : 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '6px', backgroundColor: '#1e2842', color: '#ffffff', fontWeight: 700, fontSize: '13px' }}
            >
              <Check size={16} /> {submitting ? 'Publishing...' : 'Publish Sheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
