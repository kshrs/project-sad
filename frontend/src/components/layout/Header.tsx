import React from 'react';
import { useReport } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import ProfileHover from './ProfileHover';
import KILogo from '../../assets/KILogo.jpeg';
import { Menu, FileDown, Lock, Unlock, Users, ArrowLeft } from 'lucide-react';
import api from '../../services/apiClient';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isViewingShared?: boolean;
  onToggleSharedView?: () => void;
  sharedCount?: number;
}

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
  isViewingShared = false,
  onToggleSharedView,
  sharedCount = 0
}: HeaderProps) {
  const { months, selectedMonth, selectMonth, isMonthLocked } = useReport();
  const { user } = useAuth();

  const handleExportPdf = () => {
    if (!selectedMonth) return;
    const url = `${api.defaults.baseURL}/reports/export-pdf?monthId=${selectedMonth._id}`;
    window.open(url, '_blank');
  };

  const isStaff = user?.role === 'STAFF';

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-header)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 20
      }}
    >
      {/* Left: Sidebar Toggle + Institutional Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#1e2842',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <img src={KILogo} alt="Kumaraguru Institutions" style={{ height: '42px', borderRadius: '4px' }} />

        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#1e2842', lineHeight: 1.2 }}>
            Staff & Student Achievement Portal
          </h1>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Kumaraguru College of Technology
          </span>
        </div>
      </div>

      {/* Center: Shared Sheets Header Switcher for Staff */}
      {isStaff && onToggleSharedView && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onToggleSharedView}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isViewingShared ? '#eff6ff' : '#f8fafc',
              border: `1px solid ${isViewingShared ? '#3b82f6' : '#cbd5e1'}`,
              color: isViewingShared ? '#1d4ed8' : '#334155',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isViewingShared ? '0 1px 3px rgba(37,99,235,0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isViewingShared ? (
              <>
                <ArrowLeft size={14} /> Back to My Sheets
              </>
            ) : (
              <>
                <Users size={14} color="#2563eb" /> Shared Sheets
                {sharedCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700
                    }}
                  >
                    {sharedCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      )}

      {/* Right: Month Selector + PDF Export + User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isMonthLocked ? (
            <span
              title="This month is locked for editing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <Lock size={12} /> LOCKED
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <Unlock size={12} /> ACTIVE
            </span>
          )}

          <select
            value={selectedMonth?._id || ''}
            onChange={(e) => selectMonth(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1e2842',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {months.map((m) => (
              <option key={m._id} value={m._id}>
                {m.monthName} {m.status === 'LOCKED' ? '(Locked)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Deterministic PDF Export Button */}
        <button
          onClick={handleExportPdf}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#1e2842',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          title="Export Infographic Analytics PDF"
        >
          <FileDown size={14} /> Export Report PDF
        </button>

        {/* Profile Dropdown */}
        <ProfileHover />
      </div>
    </header>
  );
}
