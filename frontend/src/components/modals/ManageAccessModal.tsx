import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { X, Search, Shield, Clock, Trash2, Check, UserPlus, Users, Eye } from 'lucide-react';

interface ManageAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetKey: string;
  monthId: string;
  staffId?: string;
}

export default function ManageAccessModal({
  isOpen,
  onClose,
  sheetKey,
  monthId,
  staffId
}: ManageAccessModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  // Multi-staff selection list
  const [selectedStaffList, setSelectedStaffList] = useState<User[]>([]);

  // Delegation Options applied to the selected batch
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
      const res = await api.get(`/share/${sheetKey}`, {
        params: { monthId, staffId: isAdmin ? staffId : undefined }
      });
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
  }, [isOpen, sheetKey, monthId, staffId]);

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
          // Filter out already selected staff
          const selectedIds = new Set(selectedStaffList.map((s) => s.email));
          setSearchResults((res.data.users || []).filter((u: User) => !selectedIds.has(u.email)));
        }
      } catch (err) {
        console.error('User search failed', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStaffList]);

  if (!isOpen) return null;

  const handleAddStaff = (staff: User) => {
    setSelectedStaffList((prev) => [...prev, staff]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSelectedStaff = (email: string) => {
    setSelectedStaffList((prev) => prev.filter((s) => s.email !== email));
  };

  // Grant delegation access to ALL selected staff members
  const handleGrantBatch = async () => {
    if (selectedStaffList.length === 0) return;
    try {
      setSubmitting(true);
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

      await Promise.all(
        selectedStaffList.map((staff) =>
          api.post('/share', {
            sheetKey,
            monthId,
            sharedWithEmail: staff.email,
            accessType,
            canViewExisting,
            canEditExisting,
            canDeleteExisting,
            expiresAt
          })
        )
      );

      setSelectedStaffList([]);
      setSearchQuery('');
      await loadGrantedShares();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to grant delegation');
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
          maxWidth: '680px',
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
              {isAdmin ? 'Access Governance & Delegation Audit' : 'Manage Access & Multi-Staff Delegation'}
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {isAdmin ? (
                <>Monitoring active delegation rules for: <strong>{sheetKey.replace(/([a-z])([A-Z])/g, '$1 $2')}</strong></>
              ) : (
                <>Delegate read/write authority for your sheet: <strong>{sheetKey.replace(/([a-z])([A-Z])/g, '$1 $2')}</strong></>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Multi-Staff Selection (Only Staff can create new access delegations) */}
          {!isAdmin && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Add Staff Members to Access List
              </label>
              
              {/* Selected staff tags */}
              {selectedStaffList.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {selectedStaffList.map((s) => (
                    <span
                      key={s.email}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {s.displayName}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedStaff(s.email)}
                        style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

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
                  placeholder="Search staff by name or email to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
                />
              </div>

              {/* Dropdown Suggestions */}
              {searchResults.length > 0 && (
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
                      onClick={() => handleAddStaff(u)}
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
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#2563eb' }}>
                        <UserPlus size={13} /> Add
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Granular Permission Options (Only shown when staff are selected by owner) */}
          {!isAdmin && selectedStaffList.length > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e2842', marginBottom: '10px' }}>
                Permissions for {selectedStaffList.length} Selected {selectedStaffList.length === 1 ? 'Staff' : 'Staff Members'}
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
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCanViewExisting(checked);
                        if (!checked) {
                          setCanEditExisting(false);
                        }
                      }}
                    />
                    View existing entries (if unchecked, staff can only append new rows)
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      cursor: !canViewExisting ? 'not-allowed' : 'pointer',
                      color: !canViewExisting ? '#94a3b8' : '#1e2842'
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={!canViewExisting}
                      checked={canViewExisting && canEditExisting}
                      onChange={(e) => setCanEditExisting(e.target.checked)}
                    />
                    Update / Delete existing rows entered by you
                  </label>
                </div>
              )}

              {/* Expiration Duration & Grant Action */}
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
                  onClick={handleGrantBatch}
                  disabled={submitting}
                  style={{
                    marginLeft: 'auto',
                    padding: '7px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#1e2842',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  Grant to All {selectedStaffList.length} Staff
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
                      {isAdmin && s.ownerId && (
                        <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                          Owner: {s.ownerId.displayName} ({s.ownerId.email})
                        </div>
                      )}
                      <span style={{ fontWeight: 600, color: '#1e2842' }}>{s.sharedWithId?.displayName}</span>
                      <span style={{ color: '#64748b', marginLeft: '6px' }}>({s.sharedWithId?.email})</span>
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                        {s.accessType} • Exp: {new Date(s.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(s._id)}
                      style={{ color: '#dc2626', padding: '4px', cursor: 'pointer' }}
                      title={isAdmin ? 'Admin Override: Revoke Delegation' : 'Revoke Access'}
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
