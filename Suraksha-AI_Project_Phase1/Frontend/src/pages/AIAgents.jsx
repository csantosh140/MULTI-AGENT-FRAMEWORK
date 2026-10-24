import { useState, useEffect } from 'react';
import { 
  FiCpu, 
  FiActivity, 
  FiRefreshCw, 
  FiPlay, 
  FiSquare, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiDatabase,
  FiTerminal
} from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import Table from '../components/Table';
import { useNotification } from '../hooks/useNotification';
import { 
  fetchAgents, 
  fetchAgentTasks, 
  restartAgent, 
  enableAgent, 
  disableAgent 
} from '../services/agentsService';

const AIAgents = () => {
  const { showNotification } = useNotification();
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState({ queue_size: 0, total_processed: 0, recent_messages: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores agent_id when loading actions

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resAgents = await fetchAgents();
      const resTasks = await fetchAgentTasks();
      
      if (resAgents.success) setAgents(resAgents.data);
      if (resTasks.success) setTasks(resTasks.data);
      
      if (silent) showNotification('Agent states refreshed.', 'success');
    } catch (err) {
      console.error('Failed to load agent systems data:', err);
      showNotification('Network connection error querying agent registries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll updates every 6 seconds
    const interval = setInterval(() => loadData(true), 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async (agentId, name) => {
    setActionLoading(agentId);
    showNotification(`Restarting thread for ${name}...`, 'info');
    try {
      const res = await restartAgent(agentId);
      if (res.success) {
        showNotification(`${name} thread revived successfully.`, 'success');
        loadData(true);
      } else {
        showNotification(res.message || 'Failed to restart agent.', 'error');
      }
    } catch (err) {
      showNotification('Restart command connection error.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleState = async (agentId, name, currentlyActive) => {
    setActionLoading(agentId);
    const actionName = currentlyActive ? 'disabling' : 'enabling';
    showNotification(`Dynamic config: ${actionName} ${name}...`, 'info');
    try {
      const res = currentlyActive ? await disableAgent(agentId) : await enableAgent(agentId);
      if (res.success) {
        showNotification(`${name} successfully ${currentlyActive ? 'disabled' : 'enabled'}.`, 'success');
        loadData(true);
      } else {
        showNotification(res.message || 'Config update failed.', 'error');
      }
    } catch (err) {
      showNotification('Configuration update connection error.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-bg-custom text-text-custom">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">Initializing Multi-Agent Bus...</span>
        </div>
      </div>
    );
  }

  // Map messages to log rows
  const messageRows = tasks.recent_messages.map((msg) => ({
    id: msg.message_id,
    time: new Date(msg.timestamp * 1000).toLocaleTimeString(),
    sender: msg.sender,
    receiver: msg.receiver,
    priority: msg.priority,
    task: msg.payload?.task || 'unknown_task',
    status: msg.status
  }));

  const messageHeaders = [
    { key: 'time', header: 'Timestamp', className: 'font-mono-custom text-text-muted text-xs' },
    { key: 'sender', header: 'Sender IP/ID', className: 'font-mono-custom text-text-custom text-xs font-semibold' },
    { key: 'receiver', header: 'Recipient ID', className: 'font-mono-custom text-indigo-400 text-xs font-semibold' },
    { key: 'priority', header: 'Priority', className: 'font-mono-custom text-xs' },
    { key: 'task', header: 'Dispatched Task', className: 'font-mono-custom text-text-custom text-xs' },
    { key: 'status', header: 'Queue Status', className: 'font-mono-custom text-xs' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Agentic Operations Framework</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Stateful, multi-threaded AI agents coordinating in the background to monitor, analyze, and quarantine threats.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => loadData(true)}
          icon={FiRefreshCw}
        >
          Sync Grid
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border-custom/50 shadow-sm hover:border-accent-custom/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps text-text-muted">Active Worker Threads</p>
              <h3 className="text-2xl font-bold text-text-custom mt-1 font-mono-custom">
                {agents.filter(a => a.status === 'Active').length} <span className="text-sm font-normal text-text-muted font-sans">/ {agents.length}</span>
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <FiCpu className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </Card>

        <Card className="border border-border-custom/50 shadow-sm hover:border-accent-custom/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps text-text-muted">Message Bus Queue Size</p>
              <h3 className="text-2xl font-bold text-text-custom mt-1 font-mono-custom">
                {tasks.queue_size} <span className="text-sm font-normal text-text-muted font-sans">pending</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <FiDatabase className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </Card>

        <Card className="border border-border-custom/50 shadow-sm hover:border-accent-custom/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps text-text-muted">Total Messages Routed</p>
              <h3 className="text-2xl font-bold text-text-custom mt-1 font-mono-custom">
                {tasks.total_processed} <span className="text-sm font-normal text-text-muted font-sans">messages</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <FiActivity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Agents Worker Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-text-custom uppercase tracking-wider">
            Agent Registry Workers
          </h2>
          <p className="text-[11px] text-text-muted">
            Configure system capabilities, restart execution loops, and monitor average latency metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => {
            const isOrchestrator = agent.id === 'orchestrator';
            const isActive = agent.status === 'Active';
            const isFailed = agent.status === 'Failed';
            
            return (
              <Card 
                key={agent.id} 
                className={`border transition duration-200 ${
                  isFailed ? 'border-red-500/30 bg-red-500/5' : 'border-border-custom/50 hover:border-accent-custom/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono-custom">{agent.id}</span>
                    <h4 className="text-xs font-bold text-text-custom mt-1">{agent.name}</h4>
                  </div>
                  <StatusChip status={isActive ? 'active' : isFailed ? 'inactive' : 'inactive'} label={agent.status} />
                </div>

                <div className="text-[10px] text-text-muted space-y-1.5 mt-4 border-t border-border-custom/30 pt-3">
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <span className={`font-semibold uppercase text-[9px] ${
                      agent.priority === 'Critical' ? 'text-red-400' : agent.priority === 'High' ? 'text-amber-400' : 'text-text-muted'
                    }`}>{agent.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Latency:</span>
                    <span className="font-mono-custom text-text-custom">{agent.average_execution_time} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed:</span>
                    <span className="font-mono-custom text-text-custom">{agent.messages_processed} msgs</span>
                  </div>
                  <div className="flex justify-between truncate max-w-[200px]">
                    <span>Current:</span>
                    <span className="text-indigo-400 font-mono-custom font-semibold">{agent.active_task}</span>
                  </div>
                </div>

                {/* Agent Control Actions */}
                <div className="flex space-x-2 mt-4 pt-3 border-t border-border-custom/30">
                  {!isOrchestrator && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleState(agent.id, agent.name, isActive)}
                      disabled={actionLoading !== null}
                      className="text-[10px] flex-1 py-1 px-2"
                    >
                      {isActive ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestart(agent.id, agent.name)}
                    disabled={actionLoading !== null || isOrchestrator}
                    className="text-[10px] flex-1 py-1 px-2 flex items-center justify-center space-x-1"
                  >
                    <FiRefreshCw className={actionLoading === agent.id ? 'animate-spin' : ''} />
                    <span>Restart</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Message Bus Live Trace Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-custom uppercase tracking-wider flex items-center space-x-1">
            <FiTerminal className="text-accent-custom animate-pulse" />
            <span>Message Bus Telemetry Trace</span>
          </h2>
          <span className="text-[10px] text-text-muted uppercase">REAL-TIME PACKETS OVER BUS</span>
        </div>

        <Table
          columns={messageHeaders}
          data={messageRows}
          isLoading={loading}
          emptyMessage="No routed communication trace events yet."
        />
      </div>

    </div>
  );
};

export default AIAgents;
