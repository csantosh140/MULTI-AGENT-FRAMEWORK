import React, { useState, useEffect } from 'react';
import { FiSettings, FiUser, FiBell, FiServer, FiCheck, FiCpu, FiSun, FiMoon } from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../hooks/useTheme';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../hooks/useAuth';

const Settings = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  // Settings States
  const [profile, setProfile] = useState({
    name: user?.name || 'Admin Director',
    email: user?.email || 'admin@suraksha.ai',
    clearance: 'Level-5 (Superuser)',
  });
  
  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    blockPopups: true,
    banThreshold: 95,
  });

  const defaultHost = typeof window !== 'undefined' && window.location.hostname ? `http://${window.location.hostname}:5000/api` : 'http://localhost:5000/api';
  const [apiHost, setApiHost] = useState(defaultHost);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        if (response.success && response.data) {
          const s = response.data;
          setNotifs({
            emailAlerts: s.emailAlerts,
            blockPopups: s.blockPopups,
            banThreshold: s.banThreshold,
          });
          setApiHost(s.dvwaUrl || defaultHost);
        }
      } catch (err) {
        showNotification('Failed to fetch settings from database', 'error');
      }
    };
    fetchSettings();
  }, [showNotification, defaultHost]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await settingsService.updateSettings({
        emailAlerts: notifs.emailAlerts,
        blockPopups: notifs.blockPopups,
        banThreshold: notifs.banThreshold,
        dvwaUrl: apiHost,
        theme: theme
      });
      if (response.success) {
        showNotification('Operational settings updated and synchronized!', 'success');
      }
    } catch (err) {
      showNotification('Failed to update system configurations', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">System Configurations &amp; Preferences</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Configure security rules, administrator session profiles, alerts, and API gateways.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Col: Admin Profile & API Host */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Admin Profile */}
          <Card title="Operator Profile" subtitle="Active administrator session details" className="h-fit">
            <div className="space-y-4">
              <div className="flex items-center space-x-3.5 pb-2 border-b border-border-custom/50">
                <div className="w-12 h-12 rounded-xl bg-accent-custom flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-500/10 shrink-0">
                  AD
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-custom">{profile.name}</h4>
                  <p className="text-[10px] text-text-muted mt-0.5">{profile.clearance}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase">Operator Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase">Security Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* API Host Gateway */}
          <Card title="API Gateway Config" subtitle="Endpoint binding for Flask/Express database services">
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase">Host IP / Domain URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted pointer-events-none">
                    <FiServer className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={apiHost}
                    onChange={(e) => setApiHost(e.target.value)}
                    placeholder="http://localhost:5000/api"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
                  />
                </div>
              </div>
              <p className="text-[9.5px] text-text-muted leading-relaxed">
                Provide the root URL of your active backend services to link dashboard requests to SQLi detection models.
              </p>
            </div>
          </Card>

        </div>

        {/* Right Col: Theme & Notification parameters */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Theme Settings */}
          <Card title="Display Appearance" subtitle="Select dashboard color theme options">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Dark Theme Selection */}
              <div
                onClick={() => {
                  if (!isDark) toggleTheme();
                }}
                className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden transition ${
                  isDark 
                    ? 'border-accent-custom bg-accent-custom/5 shadow-md' 
                    : 'border-border-custom hover:border-border-custom'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Operations theme</span>
                  {isDark && <FiCheck className="text-accent-custom w-4 h-4" />}
                </div>
                <div className="flex items-center space-x-2.5 mt-4">
                  <FiMoon className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="text-xs font-bold text-text-custom">Midnight Theme</span>
                    <p className="text-[9px] text-text-muted mt-0.5">Dark Slate (Default)</p>
                  </div>
                </div>
              </div>

              {/* Light Theme Selection */}
              <div
                onClick={() => {
                  if (isDark) toggleTheme();
                }}
                className={`p-4 border rounded-xl cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden transition ${
                  !isDark 
                    ? 'border-primary-custom bg-primary-custom/5 shadow-md' 
                    : 'border-border-custom hover:border-border-custom'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Operations theme</span>
                  {!isDark && <FiCheck className="text-primary-custom w-4 h-4" />}
                </div>
                <div className="flex items-center space-x-2.5 mt-4">
                  <FiSun className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="text-xs font-bold text-text-custom">Terminal Light</span>
                    <p className="text-[9px] text-text-muted mt-0.5">High-contrast slate light</p>
                  </div>
                </div>
              </div>

            </div>
          </Card>

          {/* Intrusion Threshold Rules */}
          <Card title="Alerting & Containment Thresholds" subtitle="Define thresholds for warning alerts and automated blocks">
            <div className="space-y-4 text-xs">
              
              {/* Slider for Ban Confidence */}
              <div className="space-y-2 pb-3 border-b border-border-custom/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FiCpu className="text-accent-custom" />
                    <span className="font-semibold text-text-custom">Auto-IP Containment Threshold</span>
                  </div>
                  <span className="font-mono text-red-500 font-bold">{notifs.banThreshold}% Confidence</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={notifs.banThreshold}
                  onChange={(e) => setNotifs({ ...notifs, banThreshold: parseInt(e.target.value) })}
                  className="w-full h-1 bg-border-custom rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <p className="text-[9.5px] text-text-muted leading-relaxed">
                  Automated firewalls block attacker IP host address routes when the AI model predicts query malicious confidence above this threshold.
                </p>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Email Alert Toggle */}
                <label className="flex items-start space-x-3 p-3 border border-border-custom rounded-xl cursor-pointer hover:bg-border-custom/10 transition select-none">
                  <input
                    type="checkbox"
                    checked={notifs.emailAlerts}
                    onChange={(e) => setNotifs({ ...notifs, emailAlerts: e.target.checked })}
                    className="mt-0.5 rounded text-accent-custom focus:ring-offset-0 focus:outline-none"
                  />
                  <div>
                    <span className="font-semibold text-text-custom">Email Alert Dispatches</span>
                    <p className="text-[9px] text-text-muted mt-0.5">Dispatches SMTP summaries for critical threat vectors.</p>
                  </div>
                </label>

                {/* Dashboard Toast Toggle */}
                <label className="flex items-start space-x-3 p-3 border border-border-custom rounded-xl cursor-pointer hover:bg-border-custom/10 transition select-none">
                  <input
                    type="checkbox"
                    checked={notifs.blockPopups}
                    onChange={(e) => setNotifs({ ...notifs, blockPopups: e.target.checked })}
                    className="mt-0.5 rounded text-accent-custom focus:ring-offset-0 focus:outline-none"
                  />
                  <div>
                    <span className="font-semibold text-text-custom">Dashboard Warning Toasts</span>
                    <p className="text-[9px] text-text-muted mt-0.5">Toggle floating notifications for live intercept alerts.</p>
                  </div>
                </label>

              </div>

            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="accent"
              isLoading={isSaving}
              className="px-6 py-2.5 font-bold uppercase tracking-wider text-xs"
            >
              Save Configurations
            </Button>
          </div>

        </div>

      </form>

    </div>
  );
};

export default Settings;
