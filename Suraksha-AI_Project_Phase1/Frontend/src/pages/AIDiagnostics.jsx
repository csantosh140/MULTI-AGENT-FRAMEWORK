import { useState, useEffect } from 'react';
import { 
  FiCpu, 
  FiRefreshCw, 
  FiServer, 
  FiDatabase, 
  FiShield, 
  FiActivity, 
  FiInfo, 
  FiSliders,
  FiAlertCircle
} from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import Table from '../components/Table';
import { useNotification } from '../hooks/useNotification';
import { fetchDiagnostics, triggerRetraining } from '../services/diagnosticsService';

const AIDiagnostics = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [data, setData] = useState(null);

  const loadDiagnostics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchDiagnostics();
      if (res.success) {
        setData(res.data);
        if (silent) {
          showNotification('Diagnostics metrics updated.', 'success');
        }
      } else {
        showNotification(res.message || 'Failed to load diagnostics.', 'error');
      }
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
      showNotification('Network connection error fetching diagnostics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const handleRefresh = () => {
    loadDiagnostics(true);
  };

  const handleRetrain = async () => {
    setRetraining(true);
    showNotification('Ensemble retraining triggered. Fitting all models...', 'info');
    try {
      const res = await triggerRetraining();
      if (res.success) {
        showNotification('Retraining completed! Fresh models loaded into cache.', 'success');
        loadDiagnostics();
      } else {
        showNotification(res.message || 'Retraining failed.', 'error');
      }
    } catch (err) {
      showNotification('Retraining request failed.', 'error');
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-bg-custom text-text-custom">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-accent-custom border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Loading Diagnostics Core...</span>
        </div>
      </div>
    );
  }

  const { connectivity, engine_status, agents, metrics } = data || {
    connectivity: {},
    engine_status: {},
    agents: [],
    metrics: {}
  };

  // Convert raw metrics metrics dict to table rows format
  const metricsRows = Object.entries(metrics).map(([modelName, values]) => ({
    model: modelName,
    accuracy: `${(values.accuracy * 100).toFixed(2)}%`,
    precision: `${(values.precision * 100).toFixed(2)}%`,
    recall: `${(values.recall * 100).toFixed(2)}%`,
    f1: `${(values.f1_score * 100).toFixed(2)}%`,
    time: `${values.training_time.toFixed(2)}s`
  }));

  const metricsHeaders = [
    { key: 'model', header: 'Classifier Architecture', className: 'font-semibold text-text-custom' },
    { key: 'accuracy', header: 'Accuracy', className: 'font-mono-custom text-emerald-400' },
    { key: 'precision', header: 'Precision', className: 'font-mono-custom text-indigo-400' },
    { key: 'recall', header: 'Recall', className: 'font-mono-custom text-cyan-400' },
    { key: 'f1', header: 'F1-Score', className: 'font-mono-custom text-purple-400' },
    { key: 'time', header: 'Training Latency', className: 'font-mono-custom text-text-muted' }
  ];

  return (
    <div className="space-y-6 relative">
      {retraining && (
        <div className="absolute inset-0 bg-bg-custom/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
          <div className="flex flex-col items-center space-y-4 p-6 bg-card-custom border border-border-custom rounded-xl shadow-xl max-w-sm text-center">
            <div className="w-12 h-12 border-4 border-accent-custom border-t-transparent rounded-full animate-spin"></div>
            <h3 className="font-bold text-base text-text-custom uppercase tracking-wider">RETRAINING ENSEMBLE...</h3>
            <p className="text-xs text-text-muted">
              Fitting Random Forest, Gradient Boosting, XGBoost, and Character Neural sequences over the payloads dataset. This takes a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">AI Engine Diagnostics</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Real-time performance analytics, database latencies, agent statuses, and ensemble metrics parameters.
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            icon={FiRefreshCw}
          >
            Refresh Logs
          </Button>
          <Button
            variant="primary"
            onClick={handleRetrain}
            icon={FiSliders}
          >
            Retrain Ensemble
          </Button>
        </div>
      </div>

      {/* Connectivity & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: API Latency */}
        <Card className="border border-border-custom/50 hover:border-accent-custom/50 transition duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center space-x-1">
                <FiServer className="text-accent-custom" />
                <span>Flask API Server</span>
              </span>
              <h3 className="text-2xl font-bold text-text-custom tracking-tight font-mono-custom">
                {connectivity.api_gateway_latency_ms || 1.2} <span className="text-sm font-normal text-text-muted font-sans">ms</span>
              </h3>
              <p className="text-[11px] text-text-muted">
                Gateway latency between client and backend controllers.
              </p>
            </div>
            <StatusChip status="online" label="Online" />
          </div>
        </Card>

        {/* Card 2: DB Status */}
        <Card className="border border-border-custom/50 hover:border-accent-custom/50 transition duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center space-x-1">
                <FiDatabase className="text-accent-custom" />
                <span>SQLite suraksha.db</span>
              </span>
              <h3 className="text-2xl font-bold text-text-custom tracking-tight font-mono-custom">
                {connectivity.database_latency_ms} <span className="text-sm font-normal text-text-muted font-sans">ms</span>
              </h3>
              <p className="text-[11px] text-text-muted">
                Query loop latency checking DB connectivity.
              </p>
            </div>
            <StatusChip 
              status={connectivity.database_connected ? 'active' : 'inactive'} 
              label={connectivity.database_connected ? 'Connected' : 'Offline'} 
            />
          </div>
        </Card>

        {/* Card 3: Engine Health */}
        <Card className="border border-border-custom/50 hover:border-accent-custom/50 transition duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center space-x-1">
                <FiShield className="text-accent-custom" />
                <span>Active Ensemble Model</span>
              </span>
              <h4 className="text-sm font-bold text-text-custom truncate max-w-[180px]">
                {engine_status.active_model}
              </h4>
              <div className="text-[10px] text-text-muted space-y-0.5 mt-1.5">
                <div>Model Version: <span className="text-text-custom font-medium font-mono-custom">{engine_status.model_version}</span></div>
                <div>Dataset: <span className="text-text-custom font-medium font-mono-custom">dataset_v{engine_status.dataset_version}.csv</span></div>
                <div>Last Trained: <span className="text-text-custom font-medium font-mono-custom">{engine_status.training_date ? new Date(engine_status.training_date).toLocaleDateString() : 'Unknown'}</span></div>
              </div>
            </div>
            <StatusChip 
              status={engine_status.models_loaded ? 'active' : 'inactive'} 
              label={engine_status.models_loaded ? 'Cached Loaded' : 'Missing'} 
            />
          </div>
        </Card>
      </div>

      {/* Agents Operational Monitor */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-custom uppercase tracking-wider flex items-center space-x-1">
            <FiCpu className="text-accent-custom animate-pulse" />
            <span>AI SECURITY AGENTS REGISTRY</span>
          </h3>
          <p className="text-[11px] text-text-muted">
            Status log of stateless rule scanners, latency benchmarks, and correlation trackers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <Card key={agent.name} className="border border-border-custom/30 bg-card-custom/40 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-semibold uppercase text-text-muted tracking-wide">{agent.type}</span>
                  <h4 className="text-xs font-bold text-text-custom mt-1">{agent.name}</h4>
                </div>
                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  agent.status === 'Active' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {agent.status}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                {agent.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-custom uppercase tracking-wider flex items-center space-x-1">
            <FiInfo className="text-accent-custom" />
            <span>ENSEMBLE COMPONENT METRICS PARAMETERS</span>
          </h3>
          <p className="text-[11px] text-text-muted">
            Benchmarking scores of Random Forest, Gradient Boosting, XGBoost, and LSTM Fallback classifiers retrieved from metadata registry.
          </p>
        </div>

        {metricsRows.length > 0 ? (
          <div className="border border-border-custom/50 rounded-xl overflow-hidden shadow-sm">
            <Table 
              columns={metricsHeaders} 
              data={metricsRows} 
            />
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 border border-dashed border-border-custom">
            <FiAlertCircle className="w-8 h-8 text-text-muted animate-bounce mb-3" />
            <h4 className="text-xs font-bold text-text-custom uppercase">NO DATA PRESET</h4>
            <p className="text-[10px] text-text-muted mt-1 text-center max-w-xs">
              No metrics summaries are loaded in metadata.json. Please trigger retraining to populate statistics.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIDiagnostics;
