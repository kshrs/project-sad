import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { User } from '../../types';
import { X, Search, Shield, Clock, Trash2, Check, AlertCircle } from 'lucide-react';

interface ManageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetKey: string;
  monthId: string;
}

export default function ManageAccessModal({
  isOpen,
  onClose,
  sheetKey,
  monthId
}: ManageAccessModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  // Delegation Options
  const [accessType, setAccessType] = useState<'READ_ONLY' | 'READ_WRITE'>('READ_WRITE');
  const [canViewExisting, setCanViewExisting] = useState(true);
  const [canEditExisting, setCanEditExisting] = useState(false);
  const [canDeleteExisting, setCanDeleteExisting] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);

  const [activeShares, setActiveShares] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch currently granted shares
  const loadGrantedShares = async () => {
    try {
      const res = await api.get(`/share/${sheetKey}`, { params: { monthId } });
      if (res.data?.success) {
        setActiveShares(res.data.shares || []);
      }
    } catch (err) {
      console.error('Failed to load granted shares', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGrantedShares();
    }
  }, [isOpen, sheetKey, monthId]);

  // Real-time debounce search for staff
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/users/search', { params: { q: searchQuery } });
        if (res.data?.success) {
          setSearchResults(res.data.users || []);
        }
      } catch (err) {
        console.error('User search failed', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleGrant = async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
      await api.post('/share', {
        sheetKey,
        monthId,
        sharedWithEmail: selectedStaff.email,
        accessType,
        canViewExisting,
        canEditExisting,
        canDeleteExisting,
        expiresAt
      });
      setSelectedStaff(null);
      setSearchQuery('');
      await loadGrantedShares();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to grant share');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (ruleId: string) => {
    try {
      await api.delete(`/share/${ruleId}`);
      await loadGrantedShares();
    } catch (err: any) {
      alert('Failed to revoke access');
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
          maxWidth: '650px',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
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
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e2842' }}>
              Manage Access & Delegation
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Delegate read/write authority for sheet: <strong>{sheetKey}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Staff Search */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Select Staff Member to Grant Access
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 12px',
                backgroundColor: '#f8fafc'
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Type name or email to search staff directory..."
                value={selectedStaff ? `${selectedStaff.displayName} (${selectedStaff.email})` : searchQuery}
                onChange={(e) => {
                  setSelectedStaff(null);
                  setSearchQuery(e.target.value);
                }}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
              />
              {selectedStaff && (
                <button onClick={() => setSelectedStaff(null)} style={{ color: '#dc2626' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && !selectedStaff && (
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  marginTop: '4px',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}
              >
                {searchResults.map((u) => (
                  <div
                    key={u.email}
                    onClick={() => {
                      setSelectedStaff(u);
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1e2842' }}>{u.displayName}</div>
                    <div style={{ color: '#64748b' }}>({u.email})</div>
                    <div style={{ marginLeft: 'auto', fontSize: '10px', backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                      {u.department}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Granular Permission Options */}
          {selectedStaff && (
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e2842', marginBottom: '10px' }}>
                Configure Permissions for {selectedStaff.displayName}
              </div>

              {/* Access Mode */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'READ_ONLY'}
                    onChange={() => setAccessType('READ_ONLY')}
                  />
                  Read Only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'READ_WRITE'}
                    onChange={() => setAccessType('READ_WRITE')}
                  />
                  Read + Write (Collaborative)
                </label>
              </div>

              {/* Granular Checkboxes */}
              {accessType === 'READ_WRITE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '2px solid #2563eb', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canViewExisting}
                      onChange={(e) => setCanViewExisting(e.target.checked)}
                    />
                    View existing entries (if unchecked, staff can only append new rows)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canEditExisting}
                      onChange={(e) => setCanEditExisting(e.target.checked)}
                    />
                    Update / Delete existing rows entered by you
                  </label>
                </div>
              )}

              {/* Expiration Duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Access Expiration:</span>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value={1}>24 Hours (1 Day)</option>
                  <option value={7}>1 Week (Default)</option>
                  <option value={14}>2 Weeks</option>
                  <option value={30}>1 Month</option>
                </select>
                <button
                  onClick={handleGrant}
                  disabled={submitting}
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#1e2842',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  Grant Access
                </button>
              </div>
            </div>
          )}

          {/* Currently Active Shares List */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
              Active Delegations ({activeShares.length})
            </div>
            {activeShares.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                No active delegates for this sheet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeShares.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#1e2842' }}>{s.sharedWithId?.displayName}</span>
                      <span style={{ color: '#64748b', marginLeft: '6px' }}>({s.sharedWithId?.email})</span>
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                        {s.accessType} • Exp: {new Date(s.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(s._id)}
                      style={{ color: '#dc2626', padding: '4px', cursor: 'pointer' }}
                      title="Revoke Access"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
