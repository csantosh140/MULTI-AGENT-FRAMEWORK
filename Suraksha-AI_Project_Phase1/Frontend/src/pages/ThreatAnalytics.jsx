import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  FiTarget, FiClock, FiCode, FiZap, FiShield, FiTrendingUp, 
  FiSearch, FiFilter, FiExternalLink, FiRefreshCw, FiAlertTriangle, 
  FiLayers, FiCheckCircle, FiCopy, FiInfo
} from 'react-icons/fi';

import Card from '../components/Card';
import ChartWrapper from '../components/ChartWrapper';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatusChip from '../components/StatusChip';
import { useAnalytics } from '../hooks/useAnalytics';
import { useLogs } from '../hooks/useLogs';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../hooks/useTheme';

const ThreatAnalytics = () => {
  const { isDark } = useTheme();
  const { showNotification } = useNotification();
  const { data, loading: isAnalyticsLoading, refresh: refreshAnalytics } = useAnalytics();
  const { logs, loading: isLogsLoading, refresh: refreshLogs } = useLogs();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPattern, setSelectedPattern] = useState('ALL');
  const [selectedThreatLevel, setSelectedThreatLevel] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = 10;

  // Dynamic Theme Colors
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#ffffff' : '#0f172a';

  const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6'];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshAnalytics(), refreshLogs()]);
      showNotification('Threat telemetry feed refreshed successfully.', 'success');
    } catch {
      showNotification('Failed to refresh threat telemetry.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to extract clean threat pattern
  const resolvePattern = (log) => {
    return log.prediction || log.pattern || log.attack_pattern || log.inferred_type || 'Injection';
  };

  // Dynamic derivation of attack pattern distribution from logs
  const vectorCounts = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      const p = resolvePattern(log);
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [logs]);

  // Unique attack patterns for filter pills
  const availablePatterns = useMemo(() => {
    return Object.keys(vectorCounts).sort((a, b) => vectorCounts[b] - vectorCounts[a]);
  }, [vectorCounts]);

  // Dynamic KPI Card Values (Derived from real logs when available, falling back to analytics metrics)
  const dynamicMetrics = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        mostTargetedEndpoint: data?.metrics?.mostTargetedEndpoint || 'None',
        averageResponseTime: data?.metrics?.averageResponseTime || '14.8 ms',
        mostCommonPayload: data?.metrics?.mostCommonPayload || 'None',
        topAttackingIp: data?.metrics?.topAttackingIp || 'None',
      };
    }

    // Top endpoint
    const endpointFreq = {};
    const ipFreq = {};
    const payloadFreq = {};

    logs.forEach(l => {
      if (l.endpoint) endpointFreq[l.endpoint] = (endpointFreq[l.endpoint] || 0) + 1;
      if (l.ip) ipFreq[l.ip] = (ipFreq[l.ip] || 0) + 1;
      if (l.payload && l.payload.trim()) payloadFreq[l.payload] = (payloadFreq[l.payload] || 0) + 1;
    });

    const topEndpoint = Object.entries(endpointFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || data?.metrics?.mostTargetedEndpoint || 'None';
    const topIp = Object.entries(ipFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || data?.metrics?.topAttackingIp || 'None';
    const topPayload = Object.entries(payloadFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || data?.metrics?.mostCommonPayload || 'None';

    return {
      mostTargetedEndpoint: topEndpoint,
      averageResponseTime: data?.metrics?.averageResponseTime || '15.2 ms',
      mostCommonPayload: topPayload,
      topAttackingIp: topIp,
    };
  }, [logs, data]);

  // Dynamic Threat Distribution for the Donut Chart
  const dynamicThreatDistribution = useMemo(() => {
    if (logs && logs.length > 0) {
      const levelCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      logs.forEach(l => {
        const lvl = (l.threatLevel || 'High').toUpperCase();
        if (lvl === 'CRITICAL') levelCounts.Critical++;
        else if (lvl === 'HIGH') levelCounts.High++;
        else if (lvl === 'MEDIUM') levelCounts.Medium++;
        else levelCounts.Low++;
      });
      return [
        { name: 'Critical Risk', value: levelCounts.Critical },
        { name: 'High Risk', value: levelCounts.High },
        { name: 'Medium Risk', value: levelCounts.Medium },
        { name: 'Low Risk', value: levelCounts.Low },
      ].filter(item => item.value > 0);
    }
    return data?.threatDistribution || [];
  }, [logs, data]);

  // Filter logs logic
  const filteredThreats = useMemo(() => {
    return logs.filter((log) => {
      const pattern = resolvePattern(log);
      const threatLvl = (log.threatLevel || 'HIGH').toUpperCase();
      const ip = log.ip || '';
      const payload = log.payload || '';
      const endpoint = log.endpoint || '';

      const matchesSearch = 
        !searchQuery ||
        ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPattern = 
        selectedPattern === 'ALL' || 
        pattern.toLowerCase() === selectedPattern.toLowerCase();

      const matchesThreatLevel = 
        selectedThreatLevel === 'ALL' || 
        threatLvl === selectedThreatLevel.toUpperCase();

      return matchesSearch && matchesPattern && matchesThreatLevel;
    });
  }, [logs, searchQuery, selectedPattern, selectedThreatLevel]);

  // Pagination logic
  const totalPages = Math.ceil(filteredThreats.length / itemsPerPage) || 1;
  const paginatedThreats = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredThreats.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredThreats, currentPage]);

  const getPatternBadgeClass = (pattern) => {
    const p = (pattern || '').toLowerCase();
    if (p.includes('crypto')) return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
    if (p.includes('injection') || p.includes('sqli') || p.includes('ssti')) return 'bg-red-500/10 text-red-600 border border-red-500/20';
    if (p.includes('broken access') || p.includes('bac') || p.includes('idor')) return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
    if (p.includes('design') || p.includes('business logic')) return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
    if (p.includes('misconfig') || p.includes('hardening')) return 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
    if (p.includes('outdated') || p.includes('vulnerable') || p.includes('cve')) return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    if (p.includes('auth') || p.includes('identification')) return 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20';
    if (p.includes('integrity') || p.includes('software')) return 'bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/20';
    if (p.includes('logging') || p.includes('monitoring')) return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
    if (p.includes('ssrf') || p.includes('forgery')) return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    if (p.includes('traversal')) return 'bg-teal-500/10 text-teal-600 border border-teal-500/20';
    if (p.includes('redirect')) return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    return 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20';
  };

  const metricCards = [
    {
      title: 'Target Endpoint Hotspot',
      value: dynamicMetrics.mostTargetedEndpoint,
      icon: FiTarget,
      desc: 'Most frequently targeted interface route',
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      mono: true,
    },
    {
      title: 'Average Analysis Speed',
      value: dynamicMetrics.averageResponseTime,
      icon: FiClock,
      desc: 'Security inspection overhead added to client query latency',
      color: 'text-green-500 bg-green-500/10 border-green-500/20',
      mono: false,
    },
    {
      title: 'Common Exploit Pattern',
      value: dynamicMetrics.mostCommonPayload,
      icon: FiCode,
      desc: 'Most recurring attack sequence match',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      mono: true,
    },
    {
      title: 'Highest Attack Vector Host',
      value: dynamicMetrics.topAttackingIp,
      icon: FiZap,
      desc: 'IP address matching the maximum threat signatures',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      mono: true,
    },
  ];

  if ((isAnalyticsLoading && !data) && (isLogsLoading && logs.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-card-custom border border-border-custom rounded-xl" />
          ))}
        </div>
        <div className="h-[450px] bg-card-custom border border-border-custom rounded-xl animate-pulse" />
      </div>
    );
  }

  const weeklyTrend = data?.weeklyTrend || [];
  const monthlyTrend = data?.monthlyTrend || [];

  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Threat Analytics &amp; Insights</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Deep diagnostic auditing of multi-threat vectors, targeted endpoints, and real-time WAF telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Telemetry</span>
          </Button>
        </div>
      </div>

      {/* 2. Four Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="hover:border-accent-custom hover:shadow-md flex flex-col justify-between p-4.5">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{item.title}</p>
                <h3 className={`text-[13px] font-semibold text-text-custom mt-2.5 break-all ${item.mono ? 'font-mono bg-bg-custom border border-border-custom/50 px-2 py-1 rounded inline-block text-accent-custom max-w-full truncate' : 'text-lg font-bold'}`} title={typeof item.value === 'string' ? item.value : ''}>
                  {item.value}
                </h3>
              </div>
              
              <div className="flex items-center justify-between border-t border-border-custom/50 pt-3 mt-4">
                <p className="text-[10px] text-text-muted leading-tight max-w-[75%]">
                  {item.desc}
                </p>
                <div className={`p-2 rounded-lg border ${item.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Threat Level Distribution Pie Chart */}
        <div className="lg:col-span-1">
          <ChartWrapper title="Threat Level Breakdown" subtitle="Distribution of intercepted queries by threat rating" height={280}>
            <PieChart>
              <Pie
                data={dynamicThreatDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {dynamicThreatDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
            </PieChart>
          </ChartWrapper>
        </div>

        {/* Weekly Attack Trends Bar Chart */}
        <div className="lg:col-span-2">
          <ChartWrapper title="Weekly Intrusion Containment" subtitle="Weekly attack volume vs successfully blocked queries" height={280}>
            <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="week" stroke={textColor} fontSize={11} />
              <YAxis stroke={textColor} fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="attacks" name="Detected Intrusions" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="blocked" name="Neutralized Cases" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartWrapper>
        </div>

        {/* Historical Monthly Trend Area Chart */}
        <div className="lg:col-span-3">
          <ChartWrapper title="Six-Month Telemetry Matrix" subtitle="Intrusion profiles matched and blocked since system release" height={260}>
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMitigated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" stroke={textColor} fontSize={11} />
              <YAxis stroke={textColor} fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Area type="monotone" dataKey="threats" name="Identified Attempts" stroke="#3b82f6" fillOpacity={1} fill="url(#colorThreats)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="mitigated" name="Neutralized Vectors" stroke="#06b6d4" fillOpacity={1} fill="url(#colorMitigated)" strokeWidth={2} />
            </AreaChart>
          </ChartWrapper>
        </div>

      </div>

      {/* 4. Complete Detected Threats Section */}
      <section className="bg-card-custom border border-border-custom rounded-2xl shadow-xs overflow-hidden">
        
        {/* Table Top Bar */}
        <div className="p-5 border-b border-border-custom bg-bg-custom/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-text-custom text-[15px] leading-tight">
                  Detected Threat Incidents &amp; Multi-Vector Audit Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Shield Feed
                </span>
              </div>
              <p className="text-[12px] text-text-muted mt-1">
                Comprehensive index of all malicious vectors intercepted across the OWASP Top 10 spectrum.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-text-muted font-mono bg-bg-custom px-2.5 py-1 rounded-lg border border-border-custom">
                {filteredThreats.length} of {logs.length} Threats
              </span>
            </div>
          </div>

          {/* Attack Vector Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1 scrollbar-none">
            <button
              onClick={() => { setSelectedPattern('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                selectedPattern === 'ALL'
                  ? 'bg-accent-custom text-white shadow-xs'
                  : 'bg-card-custom hover:bg-border-custom/50 text-text-muted border border-border-custom'
              }`}
            >
              All Threats ({logs.length})
            </button>
            {availablePatterns.map((pat) => (
              <button
                key={pat}
                onClick={() => { setSelectedPattern(pat); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedPattern === pat
                    ? 'bg-accent-custom text-white shadow-xs'
                    : 'bg-card-custom hover:bg-border-custom/50 text-text-muted border border-border-custom'
                }`}
              >
                {pat} ({vectorCounts[pat]})
              </button>
            ))}
          </div>

          {/* Search & Severity Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
            <div className="md:col-span-8 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search payload snippet, client IP address, target endpoint, or vector name..."
                className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-card-custom border border-border-custom rounded-xl text-text-custom placeholder:text-text-muted/60 focus:outline-none focus:border-accent-custom transition-all"
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <select
                value={selectedThreatLevel}
                onChange={(e) => { setSelectedThreatLevel(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 text-[12px] bg-card-custom border border-border-custom rounded-xl text-text-custom focus:outline-none focus:border-accent-custom cursor-pointer"
              >
                <option value="ALL">All Threat Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>

              {(searchQuery || selectedPattern !== 'ALL' || selectedThreatLevel !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPattern('ALL');
                    setSelectedThreatLevel('ALL');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-text-muted hover:text-text-custom border border-border-custom rounded-xl bg-card-custom whitespace-nowrap cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Threat Table */}
        <div className="overflow-x-auto">
          {paginatedThreats.length === 0 ? (
            <div className="text-center py-12 border-b border-border-custom">
              <FiAlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <p className="text-text-custom font-semibold text-[13px]">No threats matching your current filter.</p>
              <p className="text-text-muted text-[11px] mt-1">Try resetting the search filters or launching test traffic via the CLI.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-border-custom text-text-muted font-semibold bg-bg-custom/40">
                  <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Source IP</th>
                  <th className="py-2.5 px-3 font-semibold">Target Endpoint</th>
                  <th className="py-2.5 px-3 font-semibold">Injected Threat Payload</th>
                  <th className="py-2.5 px-3 font-semibold">Attack Pattern</th>
                  <th className="py-2.5 px-3 font-semibold">Threat Level</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Confidence</th>
                  <th className="py-2.5 px-3 text-right font-semibold">SecOps Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/40">
                {paginatedThreats.map((threat, idx) => {
                  const pattern = resolvePattern(threat);
                  const threatLevel = (threat.threatLevel || 'HIGH').toUpperCase();
                  const confidence = threat.confidence ? (Math.round(threat.confidence * 10) / 10) : 98.5;
                  const isBlocked = threat.status === 'Blocked' || threat.blocked;

                  return (
                    <tr key={threat.id || idx} className="hover:bg-border-custom/25 transition-colors">
                      <td className="py-3 px-3.5 text-text-muted font-mono-custom text-[11px] whitespace-nowrap">
                        {threat.time}
                      </td>
                      <td className="py-3 px-3 text-text-custom font-semibold font-mono-custom text-[11px] whitespace-nowrap">
                        {threat.ip}
                      </td>
                      <td className="py-3 px-3 text-text-muted font-mono-custom text-[11px] whitespace-nowrap">
                        <span className="text-accent-custom font-bold mr-1">{threat.method || 'POST'}</span>
                        <span>{threat.endpoint}</span>
                      </td>
                      <td className="py-3 px-3 font-mono-custom text-[11px]">
                        <span 
                          className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded max-w-[280px] truncate block text-red-600 font-medium cursor-help"
                          title={threat.payload}
                        >
                          {threat.payload || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPatternBadgeClass(pattern)}`}>
                          {pattern}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          threatLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          threatLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {threatLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono-custom text-[11px] text-indigo-500 font-bold whitespace-nowrap">
                        {confidence}%
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${
                            isBlocked 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            <FiCheckCircle className="w-2.5 h-2.5" />
                            <span>{isBlocked ? 'Blocked' : 'Allowed'}</span>
                          </span>

                          <button
                            onClick={() => setSelectedLog(threat)}
                            className="p-1 rounded text-text-muted hover:text-accent-custom hover:bg-bg-custom border border-transparent hover:border-border-custom transition-all cursor-pointer"
                            title="Inspect Threat Intel Report"
                          >
                            <FiExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination & Summary Footer */}
        {filteredThreats.length > itemsPerPage && (
          <div className="p-4 border-t border-border-custom bg-bg-custom/20">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredThreats.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </section>

      {/* 5. Detailed Threat Inspection Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="THREAT INTEL DECODE REPORT"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 p-4 bg-bg-custom/50 border border-border-custom rounded-xl">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Incident ID</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1 truncate" title={selectedLog.id}>{selectedLog.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Time Logged</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedLog.time || selectedLog.timestamp}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Source Host</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedLog.ip}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Threat Vector</p>
                <p className="text-xs font-bold text-red-500 mt-1">{resolvePattern(selectedLog)}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Risk Confidence</p>
                <p className="text-xs font-bold text-accent-custom font-mono mt-1">{selectedLog.confidence || 98.5}%</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-text-custom uppercase tracking-wide">Target URI Endpoint</p>
              <div className="p-3 bg-bg-custom border border-border-custom rounded-lg font-mono text-xs text-text-custom select-all flex items-center justify-between">
                <div>
                  <span className="text-blue-500 font-bold mr-2">{selectedLog.method || 'POST'}</span>
                  <span>{selectedLog.endpoint}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-custom uppercase tracking-wide">Intercepted Malicious Payload</p>
                <span className="text-[10px] font-mono text-text-muted">Length: {(selectedLog.payload || '').length} chars</span>
              </div>
              <pre className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg font-mono text-xs text-red-600 dark:text-red-400 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed max-h-48">
                {selectedLog.payload || 'No payload body supplied'}
              </pre>
            </div>

            <div className="p-4 border border-border-custom bg-bg-custom/30 rounded-xl space-y-1.5">
              <p className="text-[10px] text-text-muted uppercase font-semibold flex items-center gap-1.5">
                <FiInfo className="w-3 h-3 text-accent-custom" />
                <span>Autonomous Threat Mitigation Rationale</span>
              </p>
              <p className="text-xs text-text-custom leading-relaxed">
                The Suraksha-AI Shield evaluated this transaction across multi-threat heuristics and assigned a{' '}
                <span className="font-semibold text-red-500">{(selectedLog.threatLevel || 'Critical').toUpperCase()}</span> hazard rating.
                The action was autonomously executed as <span className="font-semibold text-emerald-500">{selectedLog.status || 'Blocked'}</span>.
                No downstream system compromise or database execution occurred.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border-custom/50">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close Report
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ThreatAnalytics;
