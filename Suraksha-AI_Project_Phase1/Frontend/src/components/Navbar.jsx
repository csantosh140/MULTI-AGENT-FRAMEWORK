import React, { useState } from 'react';
import { FiBell, FiSun, FiMoon, FiMenu, FiUser, FiSearch, FiShield, FiX, FiCheck } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = ({ setMobileOpen, mobileOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Mock Active Notifications List
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: 'CRITICAL SQLi attempt blocked from IP 198.51.100.42',
      time: '2 mins ago',
      unread: true,
      type: 'critical',
    },
    {
      id: 2,
      text: 'AI Classification model (TF-IDF) retrained successfully',
      time: '1 hour ago',
      unread: true,
      type: 'info',
    },
    {
      id: 3,
      text: 'Weekly summary PDF ready for export',
      time: '4 hours ago',
      unread: false,
      type: 'success',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-nav-custom border-b border-border-custom flex items-center justify-between px-4 md:px-6 shadow-sm shadow-shadow-color theme-transition">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg border border-border-custom text-text-custom hover:bg-border-custom/30 transition focus:outline-none"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-accent-custom flex items-center justify-center text-white font-bold animate-pulse">
            S
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-accent-custom to-primary-custom bg-clip-text text-transparent">
            Suraksha-AI
          </span>
        </div>

        {/* Global Stats or Subtitle in Header (Desktop Only) */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-text-muted">
          <FiShield className="text-accent-custom animate-pulse" />
          <span>AUTONOMOUS SECURITY OPERATIONS SHIELD ACTIVE</span>
        </div>
      </div>      {/* Right: Actions (Alerts, Admin Profile) */}
      <div className="flex items-center space-x-3.5">


        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="relative p-2 rounded-lg border border-border-custom text-text-muted hover:text-text-custom hover:bg-border-custom/30 transition focus:outline-none"
            title="System Notifications"
          >
            <FiBell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown Card */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-card-custom border border-border-custom rounded-xl shadow-xl shadow-black/35 z-50 overflow-hidden theme-transition">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom/50 bg-bg-custom/30">
                <span className="font-semibold text-xs text-text-custom uppercase tracking-wider">
                  Incidents ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-accent-custom hover:underline font-semibold flex items-center space-x-0.5"
                  >
                    <FiCheck className="w-3 h-3" /> <span>Mark Read</span>
                  </button>
                )}
              </div>
              <div className="divide-y divide-border-custom/50 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 flex flex-col space-y-1 hover:bg-border-custom/10 transition ${
                      n.unread ? 'bg-accent-custom/5' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span
                        className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${
                          n.type === 'critical'
                            ? 'bg-red-500'
                            : n.type === 'success'
                            ? 'bg-green-500'
                            : 'bg-cyan-500'
                        }`}
                      />
                      <p className="text-xs text-text-custom leading-normal">{n.text}</p>
                    </div>
                    <span className="text-[10px] text-text-muted pl-3.5">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2.5 text-center border-t border-border-custom/50 bg-bg-custom/30">
                <button
                  onClick={() => {
                    setShowNotifDropdown(false);
                    navigate('/logs');
                  }}
                  className="text-xs text-accent-custom font-semibold hover:underline"
                >
                  View Attack Database
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center space-x-2 p-1 rounded-lg border border-border-custom/40 hover:bg-border-custom/20 transition focus:outline-none"
          >
            <div className="w-7.5 h-7.5 rounded-md bg-primary-custom flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/10">
              AD
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-text-custom pr-1">
              Admin User
            </span>
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-card-custom border border-border-custom rounded-xl shadow-xl shadow-black/35 z-50 overflow-hidden theme-transition">
              <div className="px-4 py-3.5 border-b border-border-custom/50 bg-bg-custom/20">
                <p className="text-xs font-semibold text-text-custom">Administrator</p>
                <p className="text-[10px] text-text-muted mt-0.5 truncate">admin@suraksha.ai</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-text-custom hover:bg-border-custom/40 rounded-lg transition"
                >
                  Edit Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition"
                >
                  Logout Session
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
