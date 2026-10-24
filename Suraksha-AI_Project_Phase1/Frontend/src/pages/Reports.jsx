import React, { useEffect, useState } from 'react';
import { FiFileText, FiDownload, FiTrash2, FiPrinter, FiCpu, FiPlus } from 'react-icons/fi';

import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import { useReports } from '../hooks/useReports';
import { useNotification } from '../hooks/useNotification';

const Reports = () => {
  const { showNotification } = useNotification();
  const {
    reports,
    loading: isLoading,
    generating: isGenerating,
    generateReport,
    deleteReport,
    downloadReport
  } = useReports();

  const handleGenerateReport = async (type) => {
    await generateReport(type);
  };

  const handleDeleteReport = async (id, name) => {
    await deleteReport(id, name);
  };

  const handleDownload = async (id, name) => {
    await downloadReport(id, name);
  };

  const columns = [
    {
      header: 'Report Title',
      key: 'name',
      render: (_, val) => (
        <span className="flex items-center space-x-2 font-semibold text-xs text-text-custom">
          <FiFileText className="text-accent-custom text-base flex-shrink-0" />
          <span>{val}</span>
        </span>
      )
    },
    {
      header: 'Frequency',
      key: 'type',
      render: (_, val) => {
        const colors = {
          Daily: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
          Weekly: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
          Monthly: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
        };
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[val] || 'bg-slate-500/10'}`}>{val}</span>;
      }
    },
    {
      header: 'Date Compiled',
      key: 'date',
      render: (_, val) => <span className="font-mono text-xs text-text-muted">{val}</span>
    },
    {
      header: 'Attacks Logged',
      key: 'attacksCount',
      render: (_, val) => <span className="font-semibold text-xs text-red-500">{val.toLocaleString()}</span>
    },
    {
      header: 'File Size',
      key: 'size',
      render: (_, val) => <span className="font-mono text-xs text-text-muted">{val}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (_, val) => (
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
          val === 'Generated' 
            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {val}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'id',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDownload(row.id, row.name)}
            title="Download PDF"
          >
            <FiDownload />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showNotification(`Printing report: ${row.name}`, 'info')}
            title="Print Report"
          >
            <FiPrinter />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteReport(row.id, row.name)}
            title="Delete Archive"
          >
            <FiTrash2 />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Security Reports &amp; Audit Logs</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Compile traffic filters, WAF blocks, and AI classification confidence metrics into report archives.
        </p>
      </div>

      {/* Reports Compiler KPI Card Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { type: 'Daily', title: 'Daily Incident Audit', desc: 'Summary of logs captured during last 24h cycle.', color: 'border-blue-500/20' },
          { type: 'Weekly', title: 'Weekly Threat Vector', desc: 'Aggregates classification spikes and IP hotspots.', color: 'border-cyan-500/20' },
          { type: 'Monthly', title: 'Monthly Operations PDF', desc: 'Consolidated SLA analysis and model retraining stats.', color: 'border-purple-500/20' },
        ].map((item, idx) => (
          <Card key={idx} className={`border ${item.color} flex flex-col justify-between h-44`}>
            <div>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{item.type} compiler</span>
              <h4 className="text-sm font-bold text-text-custom mt-1.5">{item.title}</h4>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">{item.desc}</p>
            </div>
            
            <Button
              variant="accent"
              size="sm"
              isLoading={isGenerating}
              onClick={() => handleGenerateReport(item.type)}
              className="mt-3 text-[11px] font-semibold uppercase tracking-wider self-start"
            >
              Compile Report
            </Button>
          </Card>
        ))}
      </div>

      {/* Historical Logs List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-text-custom uppercase tracking-wide">
          Report Archive Logs
        </h2>
        
        <Table
          columns={columns}
          data={reports}
          isLoading={isLoading}
          emptyMessage="No archived reports found."
        />
      </div>

    </div>
  );
};

export default Reports;
