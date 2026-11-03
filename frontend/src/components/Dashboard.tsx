import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import SheetTable from './sheets/SheetTable';
import { User } from '../types';
import { Layers } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSheetKey, setActiveSheetKey] = useState<string | null>('AwardsReceived');
  const [sharedOwnerId, setSharedOwnerId] = useState<string | undefined>(undefined);
  const [selectedStaffUser, setSelectedStaffUser] = useState<User | null>(null);

  const handleSelectSheet = (sheetKey: string, ownerId?: string) => {
    setActiveSheetKey(sheetKey);
    setSharedOwnerId(ownerId);
  };

  const handleSelectStaffUser = (staff: User | null) => {
    setSelectedStaffUser(staff);
    setSharedOwnerId(staff?.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          isOpen={isSidebarOpen}
          activeSheetKey={activeSheetKey}
          onSelectSheet={handleSelectSheet}
          selectedStaffUser={selectedStaffUser}
          onSelectStaffUser={handleSelectStaffUser}
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
