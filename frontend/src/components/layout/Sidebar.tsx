import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { useReport } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import { SheetDefinition, SharedSheetItem, User } from '../../types';
import CreateSheetModal from '../modals/CreateSheetModal';
import { Search, Users, Layers, Clock, Plus, UserCheck, ArrowLeft } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeSheetKey: string | null;
  onSelectSheet: (sheetKey: string, sharedOwnerId?: string) => void;
  selectedStaffUser: User | null;
  onSelectStaffUser: (staff: User | null) => void;
  isViewingShared?: boolean;
  onBackToMySheets?: () => void;
  sharedSheetsCount?: number;
}

export default function Sidebar({
  isOpen,
  activeSheetKey,
  onSelectSheet,
  selectedStaffUser,
  onSelectStaffUser,
  isViewingShared = false,
  onBackToMySheets
}: SidebarProps) {
  const { selectedMonth, refreshKey } = useReport();
  const { user } = useAuth();

  const [sheets, setSheets] = useState<SheetDefinition[]>([]);
  const [sharedSheets, setSharedSheets] = useState<SharedSheetItem[]>([]);
  const [allStaffList, setAllStaffList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const isAdminOrCoordinator = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  // Fetch all staff users for Admin view
  useEffect(() => {
    if (isAdminOrCoordinator) {
      api.get('/users/search').then((res) => {
        if (res.data?.success) {
          setAllStaffList(res.data.users || []);
        }
      });
    }
  }, [isAdminOrCoordinator]);

  // Fetch sheets metadata (for selected staff if Admin, or for current user if Staff)
  const targetOwnerId = isAdminOrCoordinator ? selectedStaffUser?.id : user?.id;

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/sheets', {
          params: {
            monthId: selectedMonth?._id,
            staffId: targetOwnerId
          }
        });
        if (res.data?.success) {
          setSheets(res.data.sheets || []);
          setSharedSheets(res.data.sharedWithMe || []);
        }
      } catch (err) {
        console.error('Failed to load sheets metadata', err);
      }
    };

    fetchMetadata();
  }, [selectedMonth?._id, targetOwnerId, refreshKey]);

  // Filter sheets by search query
  const filteredSheets = sheets.filter(
    (s) =>
      s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sheetKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShared = sharedSheets.filter(
    (s) =>
      s.sheetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        maxWidth: 'var(--sidebar-width)',
        flexShrink: 0,
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--header-height))',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Shared Mode Top Banner & Back Action */}
      {isViewingShared && onBackToMySheets && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#1d4ed8',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Viewing Delegated Sheets
          </div>
          <button
            onClick={onBackToMySheets}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#1e2842',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            <ArrowLeft size={14} /> Go Back to Your Sheets
          </button>
        </div>
      )}

      {/* Admin Staff Selector Header */}
      {isAdminOrCoordinator && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Staff Portfolio View
            </span>
            <button
              onClick={() => setIsCreateSheetOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#60a5fa',
                backgroundColor: 'rgba(37, 99, 235, 0.25)',
                padding: '3px 8px',
                borderRadius: '4px'
              }}
              title="Create & publish a new sheet"
            >
              <Plus size={12} /> New Sheet
            </button>
          </div>

          <select
            value={selectedStaffUser?.id || ''}
            onChange={(e) => {
              const staffId = e.target.value;
              const found = allStaffList.find((s) => s.id === staffId);
              onSelectStaffUser(found || null);
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Department Overview (Aggregate)</option>
            {allStaffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName} ({st.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Input */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '6px 10px',
            borderRadius: '6px'
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search criteria sheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '12px',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Sheets Navigation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {/* If in Shared Sheets Mode: show ONLY the shared sheets list with owner details */}
        {isViewingShared ? (
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#93c5fd',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 8px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={12} /> Delegated Sheets Shared With You ({filteredShared.length})
            </div>

            {filteredShared.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No sheets have been shared with you for this month.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredShared.map((item) => {
                  const isActive = activeSheetKey === item.sheetKey && targetOwnerId === item.owner.id;
                  return (
                    <button
                      key={item.ruleId}
                      onClick={() => onSelectSheet(item.sheetKey, item.owner.id)}
                      title={`${item.sheetName} (${item.owner.displayName})`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: '#ffffff',
                        fontSize: '12px',
                        textAlign: 'left',
                        minWidth: 0,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0 }}>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontWeight: 700,
                            color: '#ffffff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            paddingRight: '6px'
                          }}
                        >
                          {item.sheetName}
                        </span>
                        <span style={{ flexShrink: 0, fontSize: '10px', backgroundColor: '#2563eb', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.totalItems}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#93c5fd',
                          marginTop: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 600
                        }}
                      >
                        Owner: {item.owner.displayName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#cbd5e1', marginTop: '4px' }}>
                        <span>Mode: {item.accessType}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} /> Exp: {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Normal Personal Sheets Mode */
          <>
            {/* Section 1: Sheets */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 8px',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={12} /> Criteria Sheets ({filteredSheets.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {filteredSheets.map((s) => {
                  const isActive = activeSheetKey === s.sheetKey;
                  return (
                    <button
                      key={s.sheetKey}
                      onClick={() => onSelectSheet(s.sheetKey, isAdminOrCoordinator ? targetOwnerId : undefined)}
                      title={s.displayName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '5px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: isActive ? '#ffffff' : '#cbd5e1',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        minWidth: 0
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          paddingRight: '8px'
                        }}
                      >
                        {s.displayName}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          backgroundColor: s.totalItems > 0 ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff'
                        }}
                      >
                        {s.totalItems}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Shared With Me Preview (Only for individual staff) */}
            {!isAdminOrCoordinator && sharedSheets.length > 0 && (
              <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#60a5fa',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '4px 8px',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Users size={12} /> Shared With Me ({filteredShared.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredShared.map((item) => (
                    <button
                      key={item.ruleId}
                      onClick={() => onSelectSheet(item.sheetKey, item.owner.id)}
                      title={`${item.sheetName} (${item.owner.displayName})`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        color: '#ffffff',
                        fontSize: '12px',
                        textAlign: 'left',
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0 }}>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontWeight: 700,
                            color: '#93c5fd',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            paddingRight: '6px'
                          }}
                        >
                          {item.sheetName}
                        </span>
                        <span style={{ flexShrink: 0, fontSize: '10px', backgroundColor: '#1e40af', padding: '1px 5px', borderRadius: '4px' }}>
                          {item.totalItems}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#cbd5e1',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Owner: {item.owner.displayName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                        <Clock size={10} /> Exp: {new Date(item.expiresAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Create Sheet Modal */}
      <CreateSheetModal
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        onCreated={() => {
          // Trigger refresh
          api.get('/sheets', { params: { monthId: selectedMonth?._id, staffId: targetOwnerId } }).then((res) => {
            if (res.data?.success) setSheets(res.data.sheets || []);
          });
        }}
      />
    </aside>
  );
}
