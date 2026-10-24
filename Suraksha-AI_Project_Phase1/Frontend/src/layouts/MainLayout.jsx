import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-custom text-text-custom theme-transition">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top Navbar */}
        <Navbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Dynamic Pages Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg-custom text-text-custom theme-transition focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

        {/* Cybersecurity Status Footer */}
        <footer className="h-10 border-t border-border-custom bg-footer-custom px-4 flex items-center justify-between text-[10px] text-text-muted select-none theme-transition shrink-0">
          <div>
            &copy; {new Date().getFullYear()} <span className="font-semibold text-text-custom">Suraksha-AI Operations Center</span>. All Rights Reserved.
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            <span className="font-semibold text-green-500">SYSTEM STATUS: OPERATIONAL (V1.0.0-BETA)</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
