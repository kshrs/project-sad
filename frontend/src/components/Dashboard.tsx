import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app-container">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <div className="app-body">
        <Sidebar
          isOpen={isSidebarOpen}
          activeSheet={activeSheet}
          onSelectSheet={setActiveSheet}
        />
        <main className="main-content">
          {activeSheet ? (
            <p>Selected Sheet: <strong>{activeSheet}</strong></p>
          ) : (
            <p>Select a sheet from the sidebar to view details.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
