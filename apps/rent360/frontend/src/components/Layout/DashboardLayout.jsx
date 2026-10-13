import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import './DashboardLayout.scss';

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeMobileSidebar} 
          aria-label="Close sidebar"
        />
      )}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={closeMobileSidebar} 
      />
      <div className="dashboard-main">
        <Header onToggleSidebar={toggleMobileSidebar} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
