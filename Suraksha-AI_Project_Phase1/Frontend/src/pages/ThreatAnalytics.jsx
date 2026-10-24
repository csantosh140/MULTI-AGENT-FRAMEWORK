import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { FiTarget, FiClock, FiCode, FiZap, FiShield, FiTrendingUp } from 'react-icons/fi';

import Card from '../components/Card';
import ChartWrapper from '../components/ChartWrapper';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../hooks/useTheme';

const ThreatAnalytics = () => {
  const { isDark } = useTheme();
  const { showNotification } = useNotification();
  const { data, loading: isLoading } = useAnalytics();

  // Dynamic Theme Colors
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#ffffff' : '#0f172a';

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
  const BAR_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

  if (isLoading || !data) {
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

  const { metrics, threatDistribution, weeklyTrend, monthlyTrend } = data;

  const metricCards = [
    {
      title: 'Target Endpoint Hotspot',
      value: metrics.mostTargetedEndpoint,
      icon: FiTarget,
      desc: 'Most frequently targeted database interface route',
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
      mono: true,
    },
    {
      title: 'Average Analysis Speed',
      value: metrics.averageResponseTime,
      icon: FiClock,
      desc: 'Security inspection overhead added to client query latency',
      color: 'text-green-500 bg-green-500/10 border-green-500/20',
      mono: false,
    },
    {
      title: 'Common Exploit Pattern',
      value: metrics.mostCommonPayload,
      icon: FiCode,
      desc: 'Most recurring attack sequence match',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      mono: true,
    },
    {
      title: 'Highest Attack Vector Host',
      value: metrics.topAttackingIp,
      icon: FiZap,
      desc: 'IP address matching the maximum threat signatures',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      mono: true,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Threat Analytics &amp; Insights</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Deep diagnostic auditing of malicious patterns, targeted system endpoints, and analysis latency.
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="hover:border-accent-custom hover:shadow-md flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{item.title}</p>
                <h3 className={`text-sm font-semibold text-text-custom mt-3 break-all ${item.mono ? 'font-mono bg-bg-custom border border-border-custom/50 px-2 py-1 rounded inline-block text-accent-custom' : 'text-lg font-bold'}`}>
                  {item.value}
                </h3>
              </div>
              
              <div className="flex items-center justify-between border-t border-border-custom/50 pt-3 mt-4.5">
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

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Threat Level Distribution Pie Chart */}
        <div className="lg:col-span-1">
          <ChartWrapper title="Threat Level Breakdown" subtitle="Distribution of intercepted queries by threat rating" height={280}>
            <PieChart>
              <Pie
                data={threatDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {threatDistribution.map((entry, index) => (
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
          <ChartWrapper title="Six-Month Telemetry Matrix" subtitle="Intrusion profiles matched and blocked since system release" height={300}>
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

    </div>
  );
};

export default ThreatAnalytics;
