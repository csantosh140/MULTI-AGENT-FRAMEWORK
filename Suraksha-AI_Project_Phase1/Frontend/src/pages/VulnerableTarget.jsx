import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiTarget, 
  FiShield, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiLock, 
  FiSearch, 
  FiActivity, 
  FiCpu, 
  FiArrowRight, 
  FiZap,
  FiTerminal
} from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import { useNotification } from '../hooks/useNotification';
import { sendTargetLogin, sendTargetSearch } from '../services/targetService';

const VulnerableTarget = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'search'
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const attackPresets = {
    login: [
      {
        name: "Classic Auth Bypass",
        desc: "' OR '1'='1' --",
        username: "' OR '1'='1' --",
        password: "password123",
        severity: "Medium"
      },
      {
        name: "Admin User Bypass",
        desc: "admin' --",
        username: "admin' --",
        password: "any",
        severity: "High"
      },
      {
        name: "Legitimate Login",
        desc: "admin / admin123",
        username: "admin",
        password: "admin123",
        severity: "Safe"
      }
    ],
    search: [
      {
        name: "UNION Based Schema Extract",
        desc: "' UNION SELECT 1, table_name, 3 FROM information_schema.tables --",
        query: "' UNION SELECT 1, table_name, 3 FROM information_schema.tables --",
        category: "electronics",
        severity: "Critical"
      },
      {
        name: "Time-based Blind Delay",
        desc: "1'; WAITFOR DELAY '0:0:5'--",
        query: "1'; WAITFOR DELAY '0:0:5'--",
        category: "all",
        severity: "Critical"
      },
      {
        name: "Stacked Drop Table Query",
        desc: "1; DROP TABLE users;--",
        query: "1; DROP TABLE users;--",
        category: "security",
        severity: "Critical"
      },
      {
        name: "Legitimate Query",
        desc: "cybersecurity firewall",
        query: "cybersecurity firewall",
        category: "all",
        severity: "Safe"
      }
    ]
  };

  const handleApplyPreset = (preset) => {
    if (activeTab === 'login') {
      setUsername(preset.username);
      setPassword(preset.password);
    } else {
      setSearchQuery(preset.query);
      setCategory(preset.category);
    }
    showNotification(`Applied preset payload: ${preset.name}`, 'info');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendTargetLogin(username, password);
      setLastResponse(res);
      if (res.data?.verdict === 'BLOCKED') {
        showNotification('Security Alert! Request BLOCKED by Suraksha-AI WAF.', 'error');
      } else {
        showNotification('Request PASSED: Evaluated as Safe.', 'success');
      }
    } catch (err) {
      showNotification('Target API connection failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendTargetSearch(searchQuery, category);
      setLastResponse(res);
      if (res.data?.verdict === 'BLOCKED') {
        showNotification('Security Alert! Query BLOCKED by Suraksha-AI WAF.', 'error');
      } else {
        showNotification('Search executed: Safe input.', 'success');
      }
    } catch (err) {
      showNotification('Target API connection failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = lastResponse?.data?.verdict === 'BLOCKED';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card-custom to-bg-custom border border-accent-custom/30 p-5 rounded-xl shadow-lg relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-custom/20 text-accent-custom border border-accent-custom/40">
              SECURITY PLAYGROUND TARGET
            </span>
            <span className="text-xs font-mono-custom text-text-muted">Target Endpoint: http://localhost:5000/api/target</span>
          </div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Vulnerable Target Application (Playground)</h2>
          <p className="text-[12px] text-text-muted max-w-2xl mt-0.5">
            Simulate security attacks against this target web application form. All requests flow through the Suraksha-AI protection pipeline.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 z-10">
          <Button
            variant="secondary"
            onClick={() => navigate('/ai-diagnostics')}
            icon={FiActivity}
          >
            AI Diagnostics
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/live')}
            icon={FiZap}
          >
            Live Logs
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Target vs Real-time WAF Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Target Web Forms */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-border-custom shadow-md">
            
            {/* Tab Switching Header */}
            <div className="flex items-center justify-between border-b border-border-custom pb-4 mb-6">
              <div className="flex space-x-2 bg-bg-custom p-1 rounded-lg border border-border-custom">
                <button
                  onClick={() => { setActiveTab('login'); setLastResponse(null); }}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                    activeTab === 'login'
                      ? 'bg-accent-custom text-white shadow-sm'
                      : 'text-text-muted hover:text-text-custom'
                  }`}
                >
                  <FiLock className="w-3.5 h-3.5" />
                  <span>1. Authentication Target (/login)</span>
                </button>
                <button
                  onClick={() => { setActiveTab('search'); setLastResponse(null); }}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                    activeTab === 'search'
                      ? 'bg-accent-custom text-white shadow-sm'
                      : 'text-text-muted hover:text-text-custom'
                  }`}
                >
                  <FiSearch className="w-3.5 h-3.5" />
                  <span>2. Catalog Search Target (/search)</span>
                </button>
              </div>

              <StatusChip status="online" label="Target Server Active" />
            </div>

            {/* Presets Bar */}
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                ⚡ Quick Presets (Click to Load Attack Vector Payload):
              </label>
              <div className="flex flex-wrap gap-2">
                {attackPresets[activeTab].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg border text-left font-mono-custom transition-all ${
                      p.severity === 'Safe'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1 font-sans">
                      <span>{p.name}</span>
                      <span className="text-[9px] opacity-75">({p.severity})</span>
                    </div>
                    <div className="text-[10px] text-text-muted font-mono-custom truncate max-w-[200px]">
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Login Target Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-custom mb-1">
                    Username / Login Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin OR ' OR '1'='1' --"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg text-sm font-mono-custom focus:outline-none focus:border-accent-custom text-text-custom"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-custom mb-1">
                    Password Credential
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg text-sm font-mono-custom focus:outline-none focus:border-accent-custom text-text-custom"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full justify-center"
                    icon={FiZap}
                  >
                    Submit Payload to Target Server
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 2: Search Target Form */}
            {activeTab === 'search' && (
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-custom mb-1">
                    Database Search Query Parameter
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. laptop OR ' UNION SELECT 1, table_name, 3 FROM information_schema.tables --"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg text-sm font-mono-custom focus:outline-none focus:border-accent-custom text-text-custom"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-custom mb-1">
                    Product Category Filter
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg text-sm text-text-custom focus:outline-none focus:border-accent-custom"
                  >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics & Hardware</option>
                    <option value="security">Security Appliances</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full justify-center"
                    icon={FiZap}
                  >
                    Execute Query against Target Server
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right Column: Real-Time Server & Suraksha-AI Interceptor Response */}
        <div className="lg:col-span-5 space-y-6">
          <Card className={`border shadow-lg transition-all duration-300 ${
            lastResponse
              ? (isBlocked ? 'border-red-500/50 bg-red-950/10' : 'border-emerald-500/50 bg-emerald-950/10')
              : 'border-border-custom bg-card-custom'
          }`}>
            <div className="flex items-center justify-between border-b border-border-custom pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-custom flex items-center space-x-2">
                <FiTerminal className="text-accent-custom" />
                <span>SURAKSHA-AI INTERCEPTOR VERDICT</span>
              </h3>
              {lastResponse && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono-custom ${
                  isBlocked ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  HTTP {lastResponse.data?.status_code || (isBlocked ? 403 : 200)}
                </span>
              )}
            </div>

            {!lastResponse ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-text-muted space-y-3">
                <FiShield className="w-12 h-12 text-border-custom animate-pulse" />
                <div className="font-bold text-sm text-text-custom">WAITING FOR TARGET REQUEST</div>
                <p className="text-xs max-w-xs">
                  Apply a preset or enter a custom payload on the left form and click Submit to test real-time AI interception.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Big Verdict Header */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  isBlocked
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                }`}>
                  {isBlocked ? (
                    <FiAlertTriangle className="w-8 h-8 flex-shrink-0 animate-bounce mt-0.5" />
                  ) : (
                    <FiCheckCircle className="w-8 h-8 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-base font-extrabold tracking-wider font-mono-custom">
                      {isBlocked ? '🔴 BLOCKED BY FIREWALL' : '🟢 ALLOWED / SAFE'}
                    </div>
                    <p className="text-xs text-text-custom mt-1 leading-relaxed">
                      {lastResponse.message}
                    </p>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-custom p-3 rounded-lg border border-border-custom">
                    <span className="text-[9px] uppercase font-bold text-text-muted block">AI Confidence Score</span>
                    <span className="text-lg font-mono-custom font-extrabold text-accent-custom">
                      {Number(lastResponse.data?.confidence || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="bg-bg-custom p-3 rounded-lg border border-border-custom">
                    <span className="text-[9px] uppercase font-bold text-text-muted block">Threat Level</span>
                    <span className={`text-sm font-bold uppercase font-mono-custom ${
                      isBlocked ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {lastResponse.data?.threat_level || 'Safe'}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-bg-custom p-3 rounded-lg border border-border-custom">
                  <span className="text-[9px] uppercase font-bold text-text-muted block mb-1">AI Detection Vector & Reason</span>
                  <p className="text-xs text-text-custom font-mono-custom leading-relaxed">
                    {lastResponse.data?.explanation || 'No malicious patterns detected.'}
                  </p>
                </div>

                {/* Raw JSON Envelope */}
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block mb-1">Raw API Response JSON</span>
                  <pre className="p-3 bg-black/60 rounded-lg text-[10px] font-mono-custom text-emerald-400 overflow-x-auto max-h-40 border border-border-custom">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>

                {/* Quick Link Buttons */}
                <div className="pt-2 border-t border-border-custom flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-bold uppercase">Logged to suraksha.db!</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate('/ai-diagnostics')}
                      className="text-xs text-accent-custom hover:underline font-bold flex items-center space-x-1"
                    >
                      <span>AI Diagnostics</span>
                      <FiArrowRight />
                    </button>
                    <button
                      onClick={() => navigate('/live')}
                      className="text-xs text-accent-custom hover:underline font-bold flex items-center space-x-1"
                    >
                      <span>Live Logs</span>
                      <FiArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};

export default VulnerableTarget;
