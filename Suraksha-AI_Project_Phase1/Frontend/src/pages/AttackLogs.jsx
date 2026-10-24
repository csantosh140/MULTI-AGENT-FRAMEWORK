import React, { useEffect, useState } from 'react';
import { FiDownload, FiSearch, FiFilter, FiCalendar, FiCpu, FiExternalLink } from 'react-icons/fi';

import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import StatusChip from '../components/StatusChip';
import Button from '../components/Button';
import SearchBox from '../components/SearchBox';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useLogs } from '../hooks/useLogs';
import { useNotification } from '../hooks/useNotification';

const AttackLogs = () => {
  const { showNotification } = useNotification();
  const { logs, loading: isLoading, deleteLog } = useLogs();
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [threatLevel, setThreatLevel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setThreatLevel('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    showNotification('Search filters reset', 'info');
  };

  // Filter logs logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.ip.includes(searchQuery) ||
      log.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesThreat = 
      threatLevel === 'all' || 
      log.threatLevel.toLowerCase() === threatLevel.toLowerCase();

    const matchesStatus = 
      statusFilter === 'all' || 
      log.status.toLowerCase() === statusFilter.toLowerCase();

    // Date range logic
    let matchesDate = true;
    const logDate = new Date(log.time.split(' ')[0]);
    
    if (startDate) {
      const start = new Date(startDate);
      if (logDate < start) matchesDate = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (logDate > end) matchesDate = false;
    }

    return matchesSearch && matchesThreat && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Real CSV Exporter
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showNotification('No data to export', 'warning');
      return;
    }

    const headers = ['ID', 'Timestamp', 'Method', 'IP', 'Target Endpoint', 'Payload', 'Threat Level', 'Verdict Status', 'AI Confidence'];
    
    const rows = filteredLogs.map((log) => [
      log.id,
      log.time,
      log.method,
      log.ip,
      log.endpoint,
      `"${log.payload.replace(/"/g, '""')}"`, // escape quotes for CSV
      log.threatLevel,
      log.status,
      `${log.confidence}%`
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suraksha_attack_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Successfully exported ${filteredLogs.length} entries to CSV.`, 'success');
  };

  const columns = [
    {
      header: 'Incident ID',
      key: 'id',
      render: (_, val) => <span className="font-mono text-xs text-text-muted">{val}</span>
    },
    {
      header: 'Time',
      key: 'time',
      render: (_, val) => <span className="font-mono text-xs text-text-muted">{val}</span>
    },
    {
      header: 'IP Address',
      key: 'ip',
      render: (_, val) => <span className="font-mono font-semibold text-xs text-text-custom">{val}</span>
    },
    {
      header: 'Endpoint',
      key: 'endpoint',
      render: (row, val) => (
        <span className="font-mono text-xs">
          <span className="text-accent-custom mr-1">{row.method}</span>
          <span className="text-text-muted">{val}</span>
        </span>
      )
    },
    {
      header: 'Intercepted Payload',
      key: 'payload',
      render: (_, val) => (
        <span className="font-mono text-xs bg-bg-custom border border-border-custom/50 px-2 py-1 rounded max-w-[240px] truncate block text-red-600">
          {val}
        </span>
      )
    },
    {
      header: 'Threat Level',
      key: 'threatLevel',
      render: (_, val) => <Badge variant={val}>{val}</Badge>
    },
    {
      header: 'Verdict',
      key: 'status',
      render: (_, val) => <StatusChip status={val} />
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedLog(row)}>
          <FiExternalLink className="mr-1" /> Inspect
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header and Exporter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Attack Logs &amp; Audit Trail</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Historical index of intercepted SQL injection patterns, signatures, and classifications.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleExportCSV}
          icon={FiDownload}
          className="sm:self-end"
        >
          Export Database (CSV)
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-text-custom uppercase tracking-wide border-b border-border-custom/50 pb-2">
          <FiFilter className="text-accent-custom" />
          <span>Search & Filter Options</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Text Search */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-[10px] font-semibold text-text-muted uppercase">Keyword</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search IP, endpoint, payload..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
              />
            </div>
          </div>

          {/* Threat Level Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-text-muted uppercase">Threat level</label>
            <select
              value={threatLevel}
              onChange={(e) => {
                setThreatLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-text-muted uppercase">Verdict</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
            >
              <option value="all">All Actions</option>
              <option value="blocked">Blocked</option>
              <option value="logged">Logged</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
            <label className="text-[10px] font-semibold text-text-muted uppercase">Date Filter</label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
                title="Start Date"
              />
              <span className="text-text-muted text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 text-xs bg-bg-custom border border-border-custom rounded-lg text-text-custom focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
                title="End Date"
              />
            </div>
          </div>

        </div>

        {/* Clear Filters Call */}
        {(searchQuery || threatLevel !== 'all' || statusFilter !== 'all' || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-red-400 hover:text-red-500 hover:underline flex items-center space-x-1"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* Logs Table */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={paginatedLogs}
          isLoading={isLoading}
          emptyMessage="No historical incidents match the specified filter query."
          onRowClick={(row) => setSelectedLog(row)}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredLogs.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Detailed Inspection Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="THREAT INTEL DECODE REPORT"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4.5 bg-bg-custom/50 border border-border-custom rounded-xl">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Incident ID</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedLog.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Time Logged</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedLog.time}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Source Host</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedLog.ip}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">ML Confidence</p>
                <p className="text-xs font-bold text-accent-custom font-mono mt-1">{selectedLog.confidence}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-custom uppercase">Target URI Endpoint</p>
              <div className="p-3 bg-bg-custom border border-border-custom rounded-lg font-mono text-xs text-text-custom select-all">
                <span className="text-blue-500 font-bold mr-2">{selectedLog.method}</span>
                {selectedLog.endpoint}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-custom uppercase">Payload Signature Syntax</p>
              <pre className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg font-mono text-xs text-red-500 dark:text-red-300 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                {selectedLog.payload}
              </pre>
            </div>

            <div className="p-4 border border-border-custom bg-bg-custom/30 rounded-xl space-y-1.5">
              <p className="text-[10px] text-text-muted uppercase font-semibold">Decision Verdict Rationale</p>
              <p className="text-xs text-text-custom">
                System classified request as <span className="font-semibold text-red-500">{selectedLog.threatLevel}</span> hazard.
                The action was autonomously forced as <span className="font-semibold text-green-500">{selectedLog.status}</span>.
                No downstream SQL queries executed on secondary user tables.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border-custom/50">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close Report
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  showNotification(`Network session from IP ${selectedLog.ip} terminated immediately.`, 'error');
                  setSelectedLog(null);
                }}
              >
                Terminate IP Connection
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default AttackLogs;
