import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiLock, 
  FiSearch, 
  FiTerminal, 
  FiZap, 
  FiArrowRight, 
  FiActivity,
  FiExternalLink,
  FiSend
} from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import { useNotification } from '../hooks/useNotification';
import { sendTargetLogin, sendTargetSearch } from '../services/targetService';

const ExternalSimulator = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const attackPresets = {
    login: [
      {
        name: "Classic Auth Bypass",
        desc: "' OR '1'='1' --",
        username: "' OR '1'='1' --",
        password: "password123",
        severity: "High"
      },
      {
        name: "Admin User Hijack",
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
        name: "UNION Schema Extraction",
        desc: "' UNION SELECT 1, table_name, 3 FROM information_schema.tables --",
        query: "' UNION SELECT 1, table_name, 3 FROM information_schema.tables --",
        category: "electronics",
        severity: "Critical"
      },
      {
        name: "Time Delay Probe",
        desc: "1'; WAITFOR DELAY '0:0:5'--",
        query: "1'; WAITFOR DELAY '0:0:5'--",
        category: "all",
        severity: "Critical"
      },
      {
        name: "Legitimate Search",
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
      if (preset.category) setCategory(preset.category);
    }
    showNotification(`Applied preset: ${preset.name}`, 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLastResponse(null);

    try {
      let response;
      if (activeTab === 'login') {
        response = await sendTargetLogin(username, password);
      } else {
        response = await sendTargetSearch(searchQuery, category);
      }

      setLastResponse(response);

      if (response && (response.status_code === 403 || response.data?.verdict === 'BLOCKED')) {
        showNotification('Security Alert: Request BLOCKED by Suraksha-AI defense models!', 'error');
      } else if (response && response.success) {
        showNotification('Request evaluated as SAFE by Suraksha-AI models.', 'success');
      } else {
        showNotification(response?.message || 'Evaluation completed.', 'warning');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      showNotification('Simulation request failed or connection error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans p-6 md:p-10">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                Isolated External Environment
              </span>
              <span className="text-xs text-gray-500 font-mono">Route: /external-simulator</span>
            </div>
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight">Standalone Attack Simulation Workbench</h2>
            <p className="text-[12px] text-slate-500 mt-0.5 max-w-3xl">
              This page simulates external requests directed towards Suraksha-AI backend APIs to test real-time threat detection.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link 
              to="/logs" 
              className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-sm font-medium transition"
            >
              <FiActivity className="mr-2" /> View Attack Logs <FiExternalLink className="ml-1.5 text-xs" />
            </Link>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-sm font-medium transition"
            >
              Suraksha Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Attack Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-gray-800 bg-[#161b22]/90 backdrop-blur">
            <div className="flex border-b border-gray-800 mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 flex items-center justify-center space-x-2 transition ${
                  activeTab === 'login'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FiLock className="w-4 h-4" />
                <span>Simulate Auth Request</span>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 px-4 font-semibold text-sm border-b-2 flex items-center justify-center space-x-2 transition ${
                  activeTab === 'search'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FiSearch className="w-4 h-4" />
                <span>Simulate Database Search Query</span>
              </button>
            </div>

            {/* Attack Presets */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center">
                <FiZap className="mr-1 text-yellow-400" /> Test Pattern Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {attackPresets[activeTab].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-lg border border-gray-800 bg-[#0d1117] hover:border-cyan-500/50 text-left transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-400 transition">{preset.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        preset.severity === 'Critical' || preset.severity === 'High'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {preset.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono truncate">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'login' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Username / Input Payload
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. ' OR '1'='1' --"
                      required
                      className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800 rounded-lg text-gray-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. password123"
                      required
                      className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800 rounded-lg text-gray-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Search Query Payload
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. ' UNION SELECT 1, table_name, 3 FROM information_schema.tables --"
                      required
                      className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800 rounded-lg text-gray-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Category Filter
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="electronics">Electronics</option>
                      <option value="security">Security Hardware</option>
                    </select>
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                className="py-3 mt-4 text-sm font-bold tracking-wide flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg shadow-lg shadow-cyan-900/30"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Evaluating Request with Suraksha AI...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    <span>Send Request to Suraksha-AI Target API</span>
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: AI Defense Response & Log Link */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-gray-800 bg-[#161b22]/90 backdrop-blur">
            <h3 className="text-base font-bold text-white mb-4 flex items-center">
              <FiShield className="mr-2 text-cyan-400" /> Suraksha-AI Real-Time Response Verdict
            </h3>

            {!lastResponse ? (
              <div className="py-12 px-4 text-center border-2 border-dashed border-gray-800 rounded-lg">
                <FiActivity className="w-10 h-10 text-gray-600 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-gray-400">Awaiting Simulation Request</p>
                <p className="text-xs text-gray-500 mt-1">Select a test preset or enter custom inputs to trigger AI evaluation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Decision Badge Box */}
                <div className={`p-4 rounded-lg border ${
                  lastResponse.status_code === 403 || lastResponse.data?.verdict === 'BLOCKED'
                    ? 'bg-red-950/40 border-red-500/40 text-red-200'
                    : 'bg-green-950/40 border-green-500/40 text-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {lastResponse.status_code === 403 || lastResponse.data?.verdict === 'BLOCKED' ? (
                        <FiAlertTriangle className="w-6 h-6 text-red-400" />
                      ) : (
                        <FiCheckCircle className="w-6 h-6 text-green-400" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-75">AI Verdict</div>
                        <div className="text-lg font-black tracking-wide">
                          {lastResponse.data?.verdict || (lastResponse.status_code === 403 ? 'BLOCKED' : 'ALLOWED')}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-sm px-2.5 py-1 rounded bg-black/40 border border-white/10 font-bold">
                      HTTP {lastResponse.status_code || (lastResponse.success ? 200 : 403)}
                    </span>
                  </div>

                  {lastResponse.message && (
                    <p className="text-xs mt-3 pt-2 border-t border-white/10 font-medium">
                      {lastResponse.message}
                    </p>
                  )}
                </div>

                {/* Response Metadata */}
                {lastResponse.data && (
                  <div className="p-4 rounded-lg bg-[#0d1117] border border-gray-800 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                      <span className="text-gray-400">Threat Level:</span>
                      <StatusChip status={lastResponse.data.threat_level || 'Safe'} />
                    </div>
                    {lastResponse.data.confidence !== undefined && (
                      <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                        <span className="text-gray-400">AI Confidence:</span>
                        <span className="text-cyan-400 font-bold">
                          {(lastResponse.data.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {lastResponse.data.explanation && (
                      <div className="pt-1">
                        <span className="text-gray-400 block mb-1">Explanation:</span>
                        <p className="text-gray-300 font-sans text-xs bg-gray-900/60 p-2.5 rounded border border-gray-800">
                          {lastResponse.data.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Link to Attack Logs */}
                <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Logged to Suraksha DB</span>
                    <span className="text-cyan-400/70">This attempt was saved to Attack Logs & Live Monitoring.</span>
                  </div>
                  <Link
                    to="/logs"
                    className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold flex items-center space-x-1 whitespace-nowrap transition"
                  >
                    <span>View Logs</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExternalSimulator;
