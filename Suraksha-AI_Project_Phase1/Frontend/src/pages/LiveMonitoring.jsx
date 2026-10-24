import React, { useEffect, useState, useRef } from 'react';
import { FiPlay, FiPause, FiFilter, FiActivity, FiSearch, FiCpu } from 'react-icons/fi';

import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import StatusChip from '../components/StatusChip';
import Button from '../components/Button';
import SearchBox from '../components/SearchBox';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useMonitoring } from '../hooks/useMonitoring';
import { useNotification } from '../hooks/useNotification';

const LiveMonitoring = () => {
  const { showNotification } = useNotification();
  const {
    requests,
    loading: isLoading,
    isPlaying,
    speed,
    setIsPlaying,
    setSpeed,
    setRequests
  } = useMonitoring(2500);
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const itemsPerPage = 10;

  // Filter & Search Logic
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
      req.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.method.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDecision = 
      decisionFilter === 'all' || 
      req.decision.toLowerCase() === decisionFilter.toLowerCase();

    return matchesSearch && matchesDecision;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (_, val) => {
        const time = new Date(val);
        return <span className="font-mono text-xs text-text-muted">{time.toLocaleTimeString()}</span>;
      }
    },
    {
      header: 'Method',
      key: 'method',
      render: (_, val) => {
        const colors = {
          GET: 'text-green-500 bg-green-500/10 border-green-500/20',
          POST: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
          PUT: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          DELETE: 'text-red-500 bg-red-500/10 border-red-500/20',
        };
        return (
          <span className={`px-2 py-0.5 rounded font-bold text-xs border ${colors[val] || colors.GET}`}>
            {val}
          </span>
        );
      }
    },
    {
      header: 'URL Path',
      key: 'url',
      render: (_, val) => <span className="font-mono text-xs text-text-custom max-w-[280px] truncate block">{val}</span>,
    },
    {
      header: 'Query Payload',
      key: 'payload',
      render: (_, val) => (
        <span className="font-mono text-xs bg-bg-custom border border-border-custom/50 px-2 py-1 rounded max-w-[220px] truncate block text-text-muted">
          {val || 'None'}
        </span>
      ),
    },
    {
      header: 'Risk Score',
      key: 'riskScore',
      render: (_, val) => {
        const isDangerous = val > 75;
        const color = isDangerous ? 'text-red-500 font-bold' : val > 40 ? 'text-amber-500' : 'text-green-500';
        return <span className={`font-mono text-xs ${color}`}>{val.toFixed(1)}%</span>;
      }
    },
    {
      header: 'Decision',
      key: 'decision',
      render: (_, val) => <StatusChip status={val} />,
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedRequest(row)}>
          Inspect
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Live Traffic Monitoring Stream</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Simulated live API traffic interceptor. Payloads are audited instantly by agentic security pipelines.
          </p>
        </div>

        {/* Live Controller Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant={isPlaying ? 'warning' : 'success'}
            size="md"
            onClick={() => setIsPlaying(!isPlaying)}
            icon={isPlaying ? FiPause : FiPlay}
          >
            {isPlaying ? 'Pause Capture' : 'Start Capture'}
          </Button>

          {/* Speed Controls */}
          {isPlaying && (
            <div className="flex items-center border border-border-custom rounded-lg p-0.5 bg-card-custom overflow-hidden">
              {[
                { label: 'Slow', value: 4000 },
                { label: 'Mid', value: 2500 },
                { label: 'Fast', value: 1000 },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    speed === s.value
                      ? 'bg-accent-custom text-white'
                      : 'text-text-muted hover:text-text-custom'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <SearchBox
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Search by URL path or query payload parameters..."
        />

        <div className="flex items-center space-x-3">
          <FiFilter className="text-text-muted" />
          <span className="text-xs font-semibold text-text-muted uppercase">Decision:</span>
          <div className="flex border border-border-custom rounded-lg p-0.5 bg-bg-custom">
            {[
              { label: 'All Traffic', value: 'all' },
              { label: 'Allowed', value: 'allowed' },
              { label: 'Blocked', value: 'blocked' },
              { label: 'Logged', value: 'logged' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setDecisionFilter(opt.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  decisionFilter === opt.value
                    ? 'bg-primary-custom text-white'
                    : 'text-text-muted hover:text-text-custom'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Stream Table */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={paginatedRequests}
          isLoading={isLoading}
          emptyMessage="No matching requests identified in the active capture buffer."
          onRowClick={(row) => setSelectedRequest(row)}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredRequests.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Details Inspector Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="LIVE HTTP PACKET DECODER"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 bg-bg-custom/50 border border-border-custom rounded-xl">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Packet ID</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedRequest.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Intercept Time</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">
                  {new Date(selectedRequest.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Risk Probability</p>
                <p className={`text-xs font-bold font-mono mt-1 ${
                  selectedRequest.riskScore > 75 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {selectedRequest.riskScore.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-custom uppercase">Full Request Route</p>
              <div className="p-3 bg-bg-custom border border-border-custom rounded-lg font-mono text-xs text-text-custom select-all">
                <span className="text-blue-500 font-bold mr-2">{selectedRequest.method}</span>
                HTTP/1.1 {selectedRequest.url}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-custom uppercase">Decoded Payload Segment</p>
              <pre className={`p-4 bg-bg-custom border border-border-custom rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all leading-normal ${
                selectedRequest.riskScore > 50 ? 'text-red-500 dark:text-red-300 border-red-500/20' : 'text-text-muted'
              }`}>
                {selectedRequest.payload || '[Empty Payload Request Body]'}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border-custom bg-bg-custom/30 rounded-xl space-y-1">
                <p className="text-[10px] text-text-muted uppercase font-semibold">Agent Verdict</p>
                <div className="mt-2.5">
                  <StatusChip status={selectedRequest.decision} />
                </div>
              </div>
              
              <div className="p-4 border border-border-custom bg-bg-custom/30 rounded-xl space-y-1">
                <p className="text-[10px] text-text-muted uppercase font-semibold">Classification Vector</p>
                <p className="text-xs font-semibold text-text-custom mt-2">
                  {selectedRequest.riskScore > 75 
                    ? 'Known Malicious SQL Signature Match' 
                    : selectedRequest.riskScore > 40 
                    ? 'Suspicous Token Sequence Identified' 
                    : 'Legitimate Safe Context Query'}
                </p>
              </div>
            </div>

            {selectedRequest.decision === 'Blocked' && (
              <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-text-muted">
                <FiCpu className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-custom">THREAT ALERT:</span> Autonomously blocked downstream execution to prevent stack overflow or schema extraction queries. IP logged for threat profiling reports.
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-border-custom/50">
              <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
                Dismiss packet
              </Button>
              {selectedRequest.decision !== 'Blocked' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setRequests((prev) =>
                      prev.map((r) =>
                        r.id === selectedRequest.id
                          ? { ...r, decision: 'Blocked', riskScore: 99.9 }
                          : r
                      )
                    );
                    showNotification(`Packet ${selectedRequest.id} has been manually flagged and blocked.`, 'error');
                    setSelectedRequest(null);
                  }}
                >
                  Force Block Request
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default LiveMonitoring;
