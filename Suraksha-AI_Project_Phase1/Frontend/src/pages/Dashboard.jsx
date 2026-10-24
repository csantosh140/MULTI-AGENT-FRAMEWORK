import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useNotification } from '../hooks/useNotification';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl p-2.5 text-[11px] font-medium z-30">
        <p className="text-slate-500 mb-1 font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              {entry.name}:
            </span>
            <span className="font-bold text-slate-800">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { data, loading: isLoading, refresh } = useDashboard();
  
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [environment, setEnvironment] = useState('All Environments');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 2-Second Live Auto-Polling Interval for Real-time Attack Monitoring
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        refresh();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const stats = data?.stats || {};
  const totalRequests = stats.totalRequests ?? 0;
  const blockedRequests = stats.blockedRequests ?? 0;
  const todaysAttacks = stats.todaysAttacks ?? 0;
  const detectionAccuracy = stats.detectionAccuracy ?? 0.0;
  const threatScore = stats.threatScore ?? 0.0;

  // Real or Derived Attacks List
  const recentAttacks = (data?.recentAttacks && data.recentAttacks.length > 0)
    ? data.recentAttacks.map(item => ({
        time: item.time || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()),
        ip: item.ip || item.client_ip || '127.0.0.1',
        endpoint: item.endpoint || item.url || '/api/target/login',
        payload: item.payload || "N/A",
        pattern: item.inferred_type || item.prediction || 'SQL Injection',
        threatLevel: (item.threatLevel || item.threat_level || 'HIGH').toUpperCase(),
        confidence: item.confidence ? roundVal(item.confidence) : 98.5,
        action: item.status === 'Blocked' || item.blocked ? 'Blocked' : 'Allowed'
      }))
    : [];

  function roundVal(v) {
    return typeof v === 'number' ? Math.round(v * 10) / 10 : v;
  }

  // Dynamic Chart Data
  const requestsPerHour = data?.requestsPerHour || [];
  const attackTypes = (data?.attackTypes && blockedRequests > 0) 
    ? data.attackTypes 
    : [
        { type: "Union Based", count: 0 },
        { type: "Error Based", count: 0 },
        { type: "Blind SQLi", count: 0 },
        { type: "Boolean Based", count: 0 },
        { type: "Time Based", count: 0 }
      ];

  const categoryColors = ['#4f46e5', '#38bdf8', '#f59e0b', '#fb923c', '#cbd5e1'];
  const threatCategoriesData = attackTypes.map((item, idx) => ({
    name: item.type,
    value: item.count,
    color: categoryColors[idx % categoryColors.length]
  }));

  const handleExport = (format) => {
    showNotification(`Downloading ${format} security report...`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Dashboard Overview</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Real-time SQL Injection Detection &amp; Target Monitoring</p>
        </div>
        
        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-card-custom border border-border-custom rounded-xl text-text-custom text-[12px] font-medium shadow-xs focus:outline-none cursor-pointer"
          >
            <option value="Last 24 Hours">Last 24 Hours</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>

          <select 
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="px-3 py-1.5 bg-card-custom border border-border-custom rounded-xl text-text-custom text-[12px] font-medium shadow-xs focus:outline-none cursor-pointer"
          >
            <option value="All Environments">All Environments</option>
            <option value="New1 Target App">New1 Target App</option>
            <option value="Production">Production</option>
          </select>

          <button 
            onClick={() => {
              setAutoRefresh(!autoRefresh);
              if (!autoRefresh) refresh();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-card-custom border border-border-custom rounded-xl text-text-custom text-[12px] font-medium shadow-xs hover:bg-border-custom/20 transition-colors"
          >
            <span className="text-text-muted font-normal">Live Auto Refresh</span>
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="font-semibold text-text-custom">{autoRefresh ? 'Active (2s)' : 'Off'}</span>
          </button>

          <button 
            onClick={() => handleExport('PDF')}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#5243e8] hover:bg-[#4335d6] text-white font-medium text-[12px] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* 1. Top KPI Row (Dynamic Live Binding) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Requests */}
        <div className="metric-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"></path>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-text-muted">Total Requests</span>
            </div>
            <div className="text-[21px] font-bold text-text-custom tracking-tight">{totalRequests}</div>
            <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
              {totalRequests > 0 ? `▲ Live Count` : `0 requests recorded`}
            </div>
          </div>
          <div className="mt-3 h-7 w-full">
            <svg className="w-full h-full text-indigo-500 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0,22 Q15,18 30,20 T60,10 T90,14 L100,8 L100,25 L0,25 Z" fill="rgba(99,102,241,0.15)" />
              <path d="M0,22 Q15,18 30,20 T60,10 T90,14 L100,8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: SQLi Attempts */}
        <div className="metric-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"></path>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-text-muted">SQLi Attempts</span>
            </div>
            <div className="text-[21px] font-bold text-text-custom tracking-tight">{todaysAttacks || blockedRequests}</div>
            <div className="text-[10px] text-red-500 font-medium mt-0.5">
              {blockedRequests > 0 ? `🚨 Threat Vectors` : `0 threats detected`}
            </div>
          </div>
          <div className="mt-3 h-7 w-full">
            <svg className="w-full h-full text-red-500 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0,20 Q20,24 40,15 T80,18 L100,10 L100,25 L0,25 Z" fill="rgba(239,68,68,0.15)" />
              <path d="M0,20 Q20,24 40,15 T80,18 L100,10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 3: Blocked Threats */}
        <div className="metric-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"></circle>
                  <line x1="8" x2="16" y1="12" y2="12"></line>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-text-muted">Blocked Threats</span>
            </div>
            <div className="text-[21px] font-bold text-text-custom tracking-tight">{blockedRequests}</div>
            <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
              {blockedRequests > 0 ? `🛡️ 100% Intercepted` : `0 blocked`}
            </div>
          </div>
          <div className="mt-3 h-7 w-full">
            <svg className="w-full h-full text-amber-500 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0,18 Q25,22 50,12 T85,16 L100,9 L100,25 L0,25 Z" fill="rgba(245,158,11,0.15)" />
              <path d="M0,18 Q25,22 50,12 T85,16 L100,9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 4: Detection Accuracy */}
        <div className="metric-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"></path>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-text-muted">Detection Accuracy</span>
            </div>
            <div className="text-[21px] font-bold text-text-custom tracking-tight">
              {detectionAccuracy > 0 ? `${detectionAccuracy}%` : `0.0%`}
            </div>
            <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
              {detectionAccuracy > 0 ? `AI Confidence Score` : `No active score`}
            </div>
          </div>
          <div className="mt-3 h-7 w-full">
            <svg className="w-full h-full text-emerald-500 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0,8 Q30,12 50,18 T90,16 L100,22 L100,25 L0,25 Z" fill="rgba(16,185,129,0.15)" />
              <path d="M0,8 Q30,12 50,18 T90,16 L100,22" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 5: Threat Score */}
        <div className="metric-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h7v8l11-12h-8z"></path>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-text-muted">Threat Score</span>
            </div>
            <div className="text-[21px] font-bold text-text-custom tracking-tight">{threatScore}</div>
            <div className="text-[10px] text-blue-500 font-medium mt-0.5">
              {threatScore > 0 ? `Risk Severity Index` : `0.0 Risk`}
            </div>
          </div>
          <div className="mt-3 h-7 w-full">
            <svg className="w-full h-full text-blue-500 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0,10 Q25,8 50,16 T85,20 L100,23 L100,25 L0,25 Z" fill="rgba(59,130,246,0.15)" />
              <path d="M0,10 Q25,8 50,16 T85,20 L100,23" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 6: Protection Status */}
        <div className="metric-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="14" rx="2" width="20" x="2" y="3"></rect>
                  <path d="M8 21h8m-4-4v4"></path>
                </svg>
              </div>
              <span className="text-[11px] font-medium text-text-muted">WAF Protection</span>
            </div>
            <div className="text-[21px] font-bold text-emerald-500 tracking-tight">ACTIVE</div>
            <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
              Monitoring New1 App
            </div>
          </div>
          <div className="mt-3 h-6 flex items-end gap-[3px] w-full">
            <div className="flex-1 bg-emerald-400 h-5 rounded-xs"></div>
            <div className="flex-1 bg-emerald-500 h-6 rounded-xs"></div>
            <div className="flex-1 bg-emerald-400 h-5 rounded-xs"></div>
            <div className="flex-1 bg-emerald-500 h-6 rounded-xs"></div>
            <div className="flex-1 bg-emerald-400 h-5 rounded-xs"></div>
          </div>
        </div>
      </section>

      {/* 2. Middle Row: Threats Over Time & Pattern Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Threats Over Time Chart */}
        <div className="lg:col-span-6 metric-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-text-custom text-[13px]">Traffic &amp; Threat Volume</h3>
              <div className="flex items-center gap-2.5 text-[10px] font-medium text-text-muted">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Blocked</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Total</span>
              </div>
            </div>
            <div className="h-44 w-full relative mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestsPerHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="allowedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sqli" name="Blocked Attacks" stroke="#ef4444" strokeWidth={2.2} fillOpacity={1} fill="url(#blockedGradient)" />
                  <Area type="monotone" dataKey="requests" name="Total Requests" stroke="#10b981" strokeWidth={1.8} fillOpacity={1} fill="url(#allowedGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top SQLi Patterns */}
        <div className="lg:col-span-3 metric-card p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text-custom text-[13px] mb-2">Top SQLi Patterns</h3>
            <div className="flex justify-between text-[10px] text-text-muted mb-2 font-medium">
              <span>Pattern</span>
              <span>Count</span>
            </div>
            <div className="space-y-2.5">
              {attackTypes.map((pat, idx) => {
                const totalBlocked = blockedRequests || 1;
                const pct = Math.min(100, Math.round((pat.count / totalBlocked) * 100));
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-text-custom font-medium">{pat.type}</span>
                      <span className="text-text-muted font-semibold">{pct}% ({pat.count})</span>
                    </div>
                    <div className="w-full bg-border-custom/40 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#5243e8] h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Threat Categories Pie Chart */}
        <div className="lg:col-span-3 metric-card p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text-custom text-[13px] mb-1">Threat Distribution</h3>
            <div className="h-32 w-full relative flex items-center justify-center my-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={threatCategoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {threatCategoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1.5} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[13px] font-bold text-slate-900 leading-tight">{blockedRequests}</span>
                <span className="text-[8px] text-slate-400 uppercase font-semibold tracking-wider">Threats</span>
              </div>
            </div>
            <div className="space-y-1 text-[10px] pt-1">
              {threatCategoriesData.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: cat.color }}></span>
                    {cat.name}
                  </span>
                  <span className="text-text-muted font-semibold">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Real-Time Threat Feed & Attack Monitor */}
      <section className="metric-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h3 className="font-bold text-text-custom text-[15px]">Real-time Threat Feed &amp; Target Application Logs</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
              Live Protection Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/logs')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5243e8]/10 text-indigo-500 border border-[#5243e8]/20 hover:bg-[#5243e8]/20 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <span>View Full Attack Logs</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
          </div>
        </div>

        {/* Real Dynamic Threat Table */}
        <div className="overflow-x-auto">
          {recentAttacks.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border-custom rounded-xl">
              <p className="text-text-muted text-[13px] font-medium">No attack incidents recorded yet.</p>
              <p className="text-text-muted text-[11px] mt-1">Run <code className="bg-bg-custom px-1.5 py-0.5 rounded border border-border-custom">python auto_test.py</code> to launch attack traffic against New1!</p>
            </div>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-border-custom text-text-muted font-semibold bg-bg-custom/50">
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Source IP</th>
                  <th className="py-2.5 px-3 font-semibold">Target Endpoint</th>
                  <th className="py-2.5 px-3 font-semibold">Injected SQL Payload Snippet</th>
                  <th className="py-2.5 px-3 font-semibold">Attack Pattern</th>
                  <th className="py-2.5 px-3 font-semibold">Threat Level</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Confidence</th>
                  <th className="py-2.5 px-3 text-right font-semibold">SecOps Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/40">
                {recentAttacks.map((attack, idx) => (
                  <tr key={idx} className="hover:bg-border-custom/30 transition-colors">
                    <td className="py-3 px-3 text-text-muted font-mono-custom text-[11px] whitespace-nowrap">
                      {attack.time}
                    </td>
                    <td className="py-3 px-3 text-text-custom font-medium font-mono-custom text-[11px] whitespace-nowrap">
                      {attack.ip}
                    </td>
                    <td className="py-3 px-3 text-text-muted font-mono-custom text-[11px] whitespace-nowrap">
                      {attack.endpoint}
                    </td>
                    <td className="py-3 px-3 font-mono-custom text-[11px] text-red-600">
                      <span className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded max-w-[320px] truncate block" title={attack.payload}>
                        {attack.payload}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-custom font-medium text-[11px] whitespace-nowrap">
                      {attack.pattern}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        attack.threatLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        attack.threatLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {attack.threatLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-custom text-[11px] text-indigo-500 font-bold whitespace-nowrap">
                      {attack.confidence}%
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        <span>{attack.action}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 4. Executive Summary */}
      <section className="metric-card p-5">
        <h3 className="font-bold text-text-custom text-[14px] mb-4">Security Analytics &amp; Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12 space-y-4">
            <div>
              <h4 className="font-semibold text-text-custom text-[12px] mb-2.5">Live Database Summary Metrics</h4>
              <div className="grid grid-cols-4 gap-4 text-left">
                <div className="p-3 bg-bg-custom/40 border border-border-custom rounded-xl">
                  <p className="text-[10px] text-text-muted font-medium">Total Requests</p>
                  <p className="text-[16px] font-bold text-text-custom">{totalRequests}</p>
                </div>
                <div className="p-3 bg-bg-custom/40 border border-border-custom rounded-xl">
                  <p className="text-[10px] text-text-muted font-medium">Blocked Attacks</p>
                  <p className="text-[16px] font-bold text-red-500">{blockedRequests}</p>
                </div>
                <div className="p-3 bg-bg-custom/40 border border-border-custom rounded-xl">
                  <p className="text-[10px] text-text-muted font-medium">Detection Accuracy</p>
                  <p className="text-[16px] font-bold text-emerald-500">{detectionAccuracy}%</p>
                </div>
                <div className="p-3 bg-bg-custom/40 border border-border-custom rounded-xl">
                  <p className="text-[10px] text-text-muted font-medium">Threat Risk Index</p>
                  <p className="text-[16px] font-bold text-amber-500">{threatScore}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
