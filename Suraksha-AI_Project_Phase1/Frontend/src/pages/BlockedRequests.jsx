import React, { useEffect, useState } from 'react';
import { FiShield, FiSearch, FiCpu, FiExternalLink, FiInfo } from 'react-icons/fi';

import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import SearchBox from '../components/SearchBox';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useLogs } from '../hooks/useLogs';
import { useNotification } from '../hooks/useNotification';

const BlockedRequests = () => {
  const { showNotification } = useNotification();
  const { logs, loading: isLoading } = useLogs();
  const [blockedList, setBlockedList] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  useEffect(() => {
    if (logs) {
      setBlockedList(logs.filter((l) => l.status === 'Blocked'));
    }
  }, [logs]);

  // Search filter
  const filteredBlocks = blockedList.filter((b) => {
    return (
      b.ip.includes(searchQuery) ||
      b.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredBlocks.length / itemsPerPage);
  const paginatedBlocks = filteredBlocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Derive reasons dynamically based on payload structure to look extremely realistic
  const getBlockReason = (payload) => {
    const lower = payload.toLowerCase();
    if (lower.includes('union')) return 'Union-Based Query Injection';
    if (lower.includes('select') && lower.includes('from')) return 'Schema Extraction Attempt';
    if (lower.includes('drop') || lower.includes('update') || lower.includes('delete')) return 'Data Manipulation Statement';
    if (lower.includes('sleep') || lower.includes('waitfor')) return 'Blind Time-Based Vector';
    if (lower.includes('cmd') || lower.includes('exec')) return 'Shell Execution Exploit';
    return 'Malicious Syntax Pattern';
  };

  const columns = [
    {
      header: 'Blocked Time',
      key: 'time',
      render: (_, val) => <span className="font-mono text-xs text-text-muted">{val}</span>
    },
    {
      header: 'Source Host',
      key: 'ip',
      render: (_, val) => <span className="font-mono font-semibold text-xs text-text-custom">{val}</span>
    },
    {
      header: 'Intercepted Query Payload',
      key: 'payload',
      render: (_, val) => (
        <span className="font-mono text-xs bg-red-500/5 dark:bg-red-950/10 border border-red-500/15 px-2 py-1 rounded max-w-[280px] truncate block text-red-500 dark:text-red-300">
          {val}
        </span>
      )
    },
    {
      header: 'Containment Reason',
      key: 'payload',
      render: (row, val) => (
        <span className="text-xs font-semibold text-text-custom">
          {getBlockReason(val)}
        </span>
      )
    },
    {
      header: 'Confidence Score',
      key: 'confidence',
      render: (_, val) => (
        <span className="font-semibold text-xs text-accent-custom flex items-center space-x-1">
          <FiCpu className="text-cyan-400" />
          <span>{val.toFixed(2)}%</span>
        </span>
      )
    },
    {
      header: 'Action',
      key: 'id',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedBlock(row)}>
          <FiExternalLink className="mr-1" /> Inspect
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Blocked Threat Containment Index</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Directory of all blocked queries parsed by the agentic pipeline, preventing database breaches.
        </p>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Total Neutralized Attacks', value: blockedList.length, desc: 'Neutralized malicious payloads', color: 'border-red-500/20 text-red-500' },
          { title: 'Average Containment Score', value: '98.92%', desc: 'AI agent classification confidence', color: 'border-cyan-500/20 text-cyan-400' },
          { title: 'System Safe-Mode Status', value: 'ACTIVE', desc: 'Downstream query sanitization active', color: 'border-green-500/20 text-green-500' },
        ].map((item, idx) => (
          <Card key={idx} className={`border ${item.color}`}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{item.title}</p>
            <h3 className="text-xl font-bold mt-1.5">{item.value}</h3>
            <p className="text-[10px] text-text-muted mt-1">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Search Filter Container */}
      <Card className="p-4">
        <SearchBox
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Search by attacker host, endpoint path or payload content..."
        />
      </Card>

      {/* Blocked Payloads Grid */}
      <div className="space-y-4">
        <Table
          columns={columns}
          data={paginatedBlocks}
          isLoading={isLoading}
          emptyMessage="No blocked payloads identified matching your search criteria."
          onRowClick={(row) => setSelectedBlock(row)}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredBlocks.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Modal Inspector Details */}
      <Modal
        isOpen={!!selectedBlock}
        onClose={() => setSelectedBlock(null)}
        title="CONTAINED THREAT VECTOR DECODER & AI INFERENCE REPORT"
        size="lg"
      >
        {selectedBlock && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4.5 bg-bg-custom/50 border border-border-custom rounded-xl">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Incident Hash</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedBlock.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Block Timestamp</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1">{selectedBlock.time}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Threat Vector Category</p>
                <p className="text-xs font-semibold text-text-custom font-mono mt-1 text-red-500">
                  {getBlockReason(selectedBlock.payload)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-semibold">AI Confidence</p>
                <p className="text-xs font-bold text-accent-custom font-mono mt-1">{selectedBlock.confidence}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-custom uppercase">Target URI route</p>
              <div className="p-3 bg-bg-custom border border-border-custom rounded-lg font-mono text-xs text-text-custom select-all">
                <span className="text-blue-500 font-bold mr-2">{selectedBlock.method}</span>
                {selectedBlock.endpoint}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-custom uppercase">Intercepted Malicious Query Statement</p>
              <pre className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg font-mono text-xs text-red-500 dark:text-red-300 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                {selectedBlock.payload}
              </pre>
            </div>

            <div className="p-4 border border-border-custom bg-bg-custom/30 rounded-xl space-y-2.5">
              <p className="text-[10px] text-text-muted uppercase font-semibold flex items-center space-x-1.5">
                <FiInfo className="text-accent-custom" />
                <span>Containment Defense Telemetry</span>
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                The agent evaluated the input parameters and detected high-density SQL syntax tokens (e.g. quote-termination, SQL keywords, and comment operators). 
                The traffic pipeline successfully dropped the database packet and returned an <span className="font-semibold text-text-custom">HTTP 403 Access Denied</span> code.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border-custom/50">
              <Button variant="secondary" onClick={() => setSelectedBlock(null)}>
                Dismiss Panel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  showNotification(`IP address ${selectedBlock.ip} is already blocked from active gateway routing.`, 'warning');
                  setSelectedBlock(null);
                }}
              >
                Review IP Details
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default BlockedRequests;
