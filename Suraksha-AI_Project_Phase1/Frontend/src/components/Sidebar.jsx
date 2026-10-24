import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"></path>
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z"></path>
        </svg>
      ),
    },
    {
      name: 'Threats',
      path: '/analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Detection',
      path: '/ai-detection',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Response',
      path: '/live',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Adversarial AI',
      path: '/generator',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Models',
      path: '/ai-agents',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Vulnerabilities',
      path: '/vulnerable-target',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Multi-Threat',
      path: '/multi-threat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      ),
    },
  ];

  const sidebarContent = (
    <aside className="w-[230px] bg-card-custom border-r border-border-custom flex flex-col justify-between shrink-0 min-h-screen p-5 select-none theme-transition">
      <div>
        {/* Brand Logo Header (matching code.html) */}
        <div className="flex items-center gap-3 px-1 mb-7">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-[18px] tracking-tight text-text-custom leading-tight">Suraksha-AI</h1>
              <p className="text-[11px] text-text-muted font-medium">AI-Powered Security</p>
            </div>
          )}
        </div>

        {/* Main Navigation (matching code.html) */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#f0efff] text-indigo-600'
                    : 'text-text-muted hover:bg-border-custom/30 hover:text-text-custom'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-text-muted'}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div>
        {/* Bottom System Status Card (matching code.html) */}
        {!isCollapsed && (
          <div className="bg-bg-custom border border-border-custom rounded-2xl p-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-text-custom text-[12px]">System Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Healthy
              </span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">AI Agents</span>
                <span className="text-emerald-500 font-semibold">6 Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Data Ingestion</span>
                <span className="text-emerald-500 font-semibold">Live</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Model Health</span>
                <span className="text-emerald-500 font-semibold">98.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Response Engine</span>
                <span className="text-emerald-500 font-semibold">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Logout Link */}
        <button
          onClick={handleLogout}
          className="w-full mt-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full h-full z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
