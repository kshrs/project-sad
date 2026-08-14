import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Mainpage from './Mainpage';

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
        <Mainpage sheetName={activeSheet} />
      </div>
    </div>
  );
};

export default Dashboard;

