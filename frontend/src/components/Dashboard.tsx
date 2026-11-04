import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReport } from '../context/ReportContext';
import api from '../services/apiClient';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import SheetTable from './sheets/SheetTable';
import { User, SharedSheetItem } from '../types';
import { Layers } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedMonth, refreshKey } = useReport();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSheetKey, setActiveSheetKey] = useState<string | null>('AwardsReceived');
  const [sharedOwnerId, setSharedOwnerId] = useState<string | undefined>(undefined);
  const [selectedStaffUser, setSelectedStaffUser] = useState<User | null>(null);

  // Shared Mode state (when staff views delegated sheets)
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [sharedSheets, setSharedSheets] = useState<SharedSheetItem[]>([]);

  // Track shared sheets count for header badge
  useEffect(() => {
    if (user?.role === 'STAFF') {
      api.get('/sheets', {
        params: {
          monthId: selectedMonth?._id,
          staffId: user.id
        }
      }).then((res) => {
        if (res.data?.success) {
          setSharedSheets(res.data.sharedWithMe || []);
        }
      }).catch((err) => console.error('Failed to load shared count', err));
    }
  }, [user?.id, user?.role, selectedMonth?._id, refreshKey]);

  const handleSelectSheet = (sheetKey: string, ownerId?: string) => {
    setActiveSheetKey(sheetKey);
    setSharedOwnerId(ownerId);
    if (ownerId && ownerId !== user?.id) {
      setIsViewingShared(true);
    }
  };

  const handleSelectStaffUser = (staff: User | null) => {
    setSelectedStaffUser(staff);
    setSharedOwnerId(staff?.id);
  };

  const handleToggleSharedView = () => {
    if (isViewingShared) {
      // Go back to personal sheets
      setIsViewingShared(false);
      setSharedOwnerId(undefined);
      setActiveSheetKey('AwardsReceived');
    } else {
      // Enter shared sheets mode
      setIsViewingShared(true);
      if (sharedSheets.length > 0) {
        setActiveSheetKey(sharedSheets[0].sheetKey);
        setSharedOwnerId(sharedSheets[0].owner.id);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isViewingShared={isViewingShared}
        onToggleSharedView={handleToggleSharedView}
        sharedCount={sharedSheets.length}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          isOpen={isSidebarOpen}
          activeSheetKey={activeSheetKey}
          onSelectSheet={handleSelectSheet}
          selectedStaffUser={selectedStaffUser}
          onSelectStaffUser={handleSelectStaffUser}
          isViewingShared={isViewingShared}
          onBackToMySheets={() => {
            setIsViewingShared(false);
            setSharedOwnerId(undefined);
            setActiveSheetKey('AwardsReceived');
          }}
          sharedSheetsCount={sharedSheets.length}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeSheetKey ? (
            <SheetTable sheetKey={activeSheetKey} sharedOwnerId={sharedOwnerId} />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}
            >
              <Layers size={48} strokeWidth={1.5} color="#94a3b8" />
              <h3 style={{ marginTop: '12px', fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                Select an Achievement Sheet
              </h3>
              <p style={{ fontSize: '12px' }}>Choose a criterion from the left sidebar to view or enter data.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
