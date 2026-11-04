import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { useReport } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import { SheetDefinition, SharedSheetItem, User } from '../../types';
import CreateSheetModal from '../modals/CreateSheetModal';
import {
  Search,
  Users,
  Layers,
  Clock,
  Plus,
  UserCheck,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileSpreadsheet
} from 'lucide-react';

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

  // VS Code Explorer-style Folder collapse state
  // Categories: FACULTY, STUDENT, RESEARCH, OUTREACH, GENERAL
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    FACULTY: true,
    STUDENT: true,
    RESEARCH: true,
    OUTREACH: true,
    GENERAL: true
  });

  // SubDir state, keyed by `category:subDir`
  const [openSubDirs, setOpenSubDirs] = useState<Record<string, boolean>>({});

  const toggleCategory = (catKey: string) => {
    setOpenCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const toggleSubDir = (subKey: string) => {
    setOpenSubDirs((prev) => ({ ...prev, [subKey]: !prev[subKey] }));
  };

  // Expand parent folders automatically when activeSheetKey changes
  useEffect(() => {
    if (!activeSheetKey || sheets.length === 0) return;
    const current = sheets.find((s) => s.sheetKey === activeSheetKey);
    if (current) {
      const cat = current.category || 'GENERAL';
      const sub = current.subDir || 'General & Others';
      setOpenCategories((prev) => ({ ...prev, [cat]: true }));
      setOpenSubDirs((prev) => ({ ...prev, [`${cat}:${sub}`]: true }));
    }
  }, [activeSheetKey, sheets]);

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
            {/* Section 1: Sheets Grouped by Category & Sub-Directory */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 8px',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={12} /> Criteria Explorer ({filteredSheets.length})
              </div>

              {/* Grouping Implementation */}
              {(() => {
                const CATEGORY_META: Record<string, { label: string; order: number }> = {
                  FACULTY: { label: 'Faculty Development', order: 1 },
                  STUDENT: { label: 'Student Achievements', order: 2 },
                  RESEARCH: { label: 'Research & Publications', order: 3 },
                  OUTREACH: { label: 'Outreach & Industry', order: 4 },
                  GENERAL: { label: 'General Criteria', order: 5 }
                };

                // Group sheets by category, then subDir
                const grouped: Record<string, Record<string, SheetDefinition[]>> = {};

                filteredSheets.forEach((s) => {
                  const cat = s.category || 'GENERAL';
                  const sub = s.subDir || 'General & Others';
                  if (!grouped[cat]) grouped[cat] = {};
                  if (!grouped[cat][sub]) grouped[cat][sub] = [];
                  grouped[cat][sub].push(s);
                });

                const sortedCategories = Object.keys(grouped).sort((a, b) => {
                  const orderA = CATEGORY_META[a]?.order ?? 99;
                  const orderB = CATEGORY_META[b]?.order ?? 99;
                  return orderA - orderB;
                });

                if (sortedCategories.length === 0) {
                  return (
                    <div style={{ padding: '16px 8px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                      No criteria sheets match "{searchQuery}"
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sortedCategories.map((catKey) => {
                      const catMeta = CATEGORY_META[catKey] || { label: catKey, order: 99 };
                      const subGroups = grouped[catKey];
                      const isCatOpen = searchQuery ? true : !!openCategories[catKey];
                      const catTotalItems = Object.values(subGroups)
                        .flat()
                        .reduce((sum, s) => sum + (s.totalItems || 0), 0);
                      const catSheetCount = Object.values(subGroups).flat().length;

                      return (
                        <div key={catKey} style={{ borderRadius: '6px', overflow: 'hidden' }}>
                          {/* Category Folder Header */}
                          <button
                            onClick={() => toggleCategory(catKey)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '6px 8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#93c5fd',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              textAlign: 'left',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              {isCatOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              {isCatOpen ? (
                                <FolderOpen size={14} color="#60a5fa" />
                              ) : (
                                <Folder size={14} color="#60a5fa" />
                              )}
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {catMeta.label}
                              </span>
                            </span>
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '10px',
                                backgroundColor: catTotalItems > 0 ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                fontWeight: 700
                              }}
                            >
                              {catTotalItems > 0 ? `${catTotalItems} (${catSheetCount})` : catSheetCount}
                            </span>
                          </button>

                          {/* Sub-Directories List */}
                          {isCatOpen && (
                            <div
                              style={{
                                marginLeft: '8px',
                                paddingLeft: '8px',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
                                marginTop: '2px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                              }}
                            >
                              {Object.keys(subGroups)
                                .sort()
                                .map((subDirName) => {
                                  const subKey = `${catKey}:${subDirName}`;
                                  const subSheets = subGroups[subDirName];
                                  const isSubOpen = searchQuery ? true : (openSubDirs[subKey] ?? true);
                                  const subTotal = subSheets.reduce((sum, s) => sum + (s.totalItems || 0), 0);

                                  return (
                                    <div key={subKey} style={{ marginTop: '2px' }}>
                                      {/* Sub-Directory Folder Header */}
                                      <button
                                        onClick={() => toggleSubDir(subKey)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          width: '100%',
                                          padding: '5px 6px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          borderRadius: '4px',
                                          color: '#e2e8f0',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          textAlign: 'left'
                                        }}
                                      >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                                          {isSubOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                          {isSubOpen ? (
                                            <FolderOpen size={12} color="#fbbf24" />
                                          ) : (
                                            <Folder size={12} color="#fbbf24" />
                                          )}
                                          <span
                                            style={{
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            {subDirName}
                                          </span>
                                        </span>
                                        <span
                                          style={{
                                            flexShrink: 0,
                                            fontSize: '9px',
                                            padding: '1px 4px',
                                            borderRadius: '8px',
                                            backgroundColor:
                                              subTotal > 0 ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.06)',
                                            color: '#cbd5e1',
                                            fontWeight: 600
                                          }}
                                        >
                                          {subSheets.length}
                                        </span>
                                      </button>

                                      {/* Sheets inside Sub-Directory */}
                                      {isSubOpen && (
                                        <div
                                          style={{
                                            marginLeft: '8px',
                                            paddingLeft: '8px',
                                            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px',
                                            marginTop: '2px'
                                          }}
                                        >
                                          {subSheets.map((s) => {
                                            const isActive = activeSheetKey === s.sheetKey;
                                            return (
                                              <button
                                                key={s.sheetKey}
                                                onClick={() =>
                                                  onSelectSheet(
                                                    s.sheetKey,
                                                    isAdminOrCoordinator ? targetOwnerId : undefined
                                                  )
                                                }
                                                title={s.displayName}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  width: '100%',
                                                  padding: '5px 8px',
                                                  borderRadius: '4px',
                                                  backgroundColor: isActive
                                                    ? 'rgba(255, 255, 255, 0.18)'
                                                    : 'transparent',
                                                  color: isActive ? '#ffffff' : '#cbd5e1',
                                                  fontSize: '11.5px',
                                                  fontWeight: isActive ? 700 : 500,
                                                  textAlign: 'left',
                                                  transition: 'all 0.15s ease',
                                                  minWidth: 0,
                                                  border: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    paddingRight: '6px'
                                                  }}
                                                >
                                                  <FileSpreadsheet
                                                    size={12}
                                                    color={isActive ? '#60a5fa' : '#94a3b8'}
                                                    style={{ flexShrink: 0 }}
                                                  />
                                                  <span
                                                    style={{
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap'
                                                    }}
                                                  >
                                                    {s.displayName}
                                                  </span>
                                                </span>
                                                <span
                                                  style={{
                                                    flexShrink: 0,
                                                    fontSize: '9.5px',
                                                    fontWeight: 700,
                                                    padding: '1px 5px',
                                                    borderRadius: '10px',
                                                    backgroundColor:
                                                      s.totalItems > 0 ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                                                    color: '#ffffff'
                                                  }}
                                                >
                                                  {s.totalItems}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
