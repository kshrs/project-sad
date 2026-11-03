import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { ColumnDefinition } from '../../types';
import { X, Check, Upload, Calendar, AlertCircle } from 'lucide-react';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({});
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

        {/* Modal Form Body (2-Column Responsive Layout) */}
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
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px dashed #cbd5e1',
                        backgroundColor: '#f8fafc',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#64748b'
                      }}
                    >
                      <Upload size={18} style={{ margin: '0 auto 4px', display: 'block', color: '#94a3b8' }} />
                      <span>Attach Proof Document (PDF/Image &le; 5MB)</span>
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
              disabled={submitting}
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
