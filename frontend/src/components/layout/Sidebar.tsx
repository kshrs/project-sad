import React, { useState, useEffect } from 'react';
import api from '../../services/apiClient';
import { useReport } from '../../context/ReportContext';
import { SheetDefinition, SharedSheetItem } from '../../types';
import { Search, FolderGit2, Users, Layers, ChevronRight, Clock } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeSheetKey: string | null;
  onSelectSheet: (sheetKey: string, sharedOwnerId?: string) => void;
}

export default function Sidebar({ isOpen, activeSheetKey, onSelectSheet }: SidebarProps) {
  const { selectedMonth, refreshKey } = useReport();
  const [sheets, setSheets] = useState<SheetDefinition[]>([]);
  const [sharedSheets, setSharedSheets] = useState<SharedSheetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const res = await api.get('/sheets', {
          params: { monthId: selectedMonth?._id }
        });
        if (res.data?.success) {
          setSheets(res.data.sheets || []);
          setSharedSheets(res.data.sharedWithMe || []);
        }
      } catch (err) {
        console.error('Failed to load sheets metadata', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [selectedMonth?._id, refreshKey]);

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
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--header-height))',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        userSelect: 'none'
      }}
    >
      {/* Search Input */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
            placeholder="Search sheets..."
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
        {/* Section 1: My Sheets */}
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
            <Layers size={12} /> My Achievement Sheets ({filteredSheets.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredSheets.map((s) => {
              const isActive = activeSheetKey === s.sheetKey;
              return (
                <button
                  key={s.sheetKey}
                  onClick={() => onSelectSheet(s.sheetKey)}
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

        {/* Section 2: Shared With Me (Grouped by Staff) */}
        {sharedSheets.length > 0 && (
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
      </div>
    </aside>
  );
}
