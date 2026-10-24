import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiCpu, FiSettings, FiCheckCircle, FiInfo, FiSliders } from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import ChartWrapper from '../components/ChartWrapper';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../hooks/useTheme';

const AIDetection = () => {
  const { isDark } = useTheme();
  const { showNotification } = useNotification();
  const [selectedModel, setSelectedModel] = useState('lstm');

  // Multi-model metadata
  const models = {
    tfidf: {
      name: 'TF-IDF + Random Forest Classifier',
      version: 'v1.2.4',
      accuracy: 98.42,
      precision: 98.20,
      recall: 98.15,
      f1Score: 98.17,
      tp: 4120,
      fp: 76,
      tn: 8590,
      fn: 82,
      trainingDate: '2026-06-12',
      size: '12.4 MB',
      rocData: [
        { fpr: 0.00, tpr: 0.00, random: 0.00 },
        { fpr: 0.02, tpr: 0.85, random: 0.02 },
        { fpr: 0.05, tpr: 0.93, random: 0.05 },
        { fpr: 0.10, tpr: 0.96, random: 0.10 },
        { fpr: 0.20, tpr: 0.98, random: 0.20 },
        { fpr: 0.50, tpr: 0.99, random: 0.50 },
        { fpr: 1.00, tpr: 1.00, random: 1.00 }
      ]
    },
    rf: {
      name: 'Optimized Random Forest Ensemble',
      version: 'v2.1.0',
      accuracy: 99.12,
      precision: 99.02,
      recall: 98.92,
      f1Score: 98.97,
      tp: 4152,
      fp: 44,
      tn: 8622,
      fn: 50,
      trainingDate: '2026-07-05',
      size: '28.1 MB',
      rocData: [
        { fpr: 0.00, tpr: 0.00, random: 0.00 },
        { fpr: 0.01, tpr: 0.91, random: 0.01 },
        { fpr: 0.03, tpr: 0.96, random: 0.03 },
        { fpr: 0.07, tpr: 0.98, random: 0.07 },
        { fpr: 0.15, tpr: 0.99, random: 0.15 },
        { fpr: 0.40, tpr: 1.00, random: 0.40 },
        { fpr: 1.00, tpr: 1.00, random: 1.00 }
      ]
    },
    lstm: {
      name: 'Bi-directional LSTM Neural Classifier',
      version: 'v3.0.2-neural',
      accuracy: 99.78,
      precision: 99.64,
      recall: 99.58,
      f1Score: 99.61,
      tp: 4180,
      fp: 16,
      tn: 8650,
      fn: 22,
      trainingDate: '2026-07-28',
      size: '142.5 MB',
      rocData: [
        { fpr: 0.00, tpr: 0.00, random: 0.00 },
        { fpr: 0.00, tpr: 0.96, random: 0.00 },
        { fpr: 0.01, tpr: 0.98, random: 0.01 },
        { fpr: 0.03, tpr: 0.99, random: 0.03 },
        { fpr: 0.10, tpr: 1.00, random: 0.10 },
        { fpr: 0.30, tpr: 1.00, random: 0.30 },
        { fpr: 1.00, tpr: 1.00, random: 1.00 }
      ]
    }
  };

  const model = models[selectedModel];

  const handleRetrain = () => {
    showNotification(`Simulated training initialized for ${model.name}. Estimated duration: 5 minutes.`, 'info');
  };

  // Recharts theme binding
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">AI Detection Models</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            Configure, benchmark, and monitor SQL injection classifier metrics and training states.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleRetrain}
          icon={FiSliders}
        >
          Retrain Active Model
        </Button>
      </div>

      {/* Model Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'lstm', name: 'Bi-LSTM Neural', type: 'Neural Model', desc: 'Sequence processing context network', badge: 'Active' },
          { key: 'rf', name: 'Random Forest', type: 'Ensemble Tree', desc: 'Quick signature token match', badge: 'Backup' },
          { key: 'tfidf', name: 'TF-IDF Vectorizer', type: 'Statistical', desc: 'Baseline character token counts', badge: 'Idle' },
        ].map((item) => (
          <Card
            key={item.key}
            onClick={() => {
              setSelectedModel(item.key);
              showNotification(`Switched diagnostics focus to: ${item.name}`, 'success');
            }}
            className={`border cursor-pointer relative overflow-hidden transition-all ${
              selectedModel === item.key
                ? 'border-accent-custom bg-accent-custom/5 shadow-md shadow-cyan-500/10'
                : 'hover:border-border-custom'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold text-text-muted uppercase">{item.type}</span>
                <h4 className="text-sm font-bold text-text-custom mt-1">{item.name}</h4>
              </div>
              <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${
                item.badge === 'Active'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : item.badge === 'Backup'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {item.badge}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-3">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Accuracy Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Model Accuracy', value: `${model.accuracy}%`, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
          { title: 'Precision (PPV)', value: `${model.precision}%`, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
          { title: 'Recall (TPR)', value: `${model.recall}%`, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
          { title: 'F1 Score', value: `${model.f1Score}%`, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        ].map((item, idx) => (
          <Card key={idx}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{item.title}</p>
            <h3 className="text-xl md:text-2xl font-bold text-text-custom mt-2 tracking-tight">{item.value}</h3>
          </Card>
        ))}
      </div>

      {/* Model Spec and Confusion Matrix Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Model Parameters */}
        <Card title="Active Classification Parameters" subtitle="Core metadata stats for selected intelligence block">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-border-custom/50">
              <span className="text-text-muted">Model Name</span>
              <span className="font-semibold text-text-custom text-right">{model.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-custom/50">
              <span className="text-text-muted">Model Build Version</span>
              <span className="font-semibold text-accent-custom font-mono">{model.version}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-custom/50">
              <span className="text-text-muted">Total Trained File Size</span>
              <span className="font-semibold text-text-custom font-mono">{model.size}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-custom/50">
              <span className="text-text-muted">Last Training Date</span>
              <span className="font-semibold text-text-custom font-mono">{model.trainingDate}</span>
            </div>
            
            <div className="p-3.5 bg-accent-custom/5 border border-accent-custom/10 rounded-xl flex items-start space-x-2 text-[10.5px] text-text-muted leading-relaxed">
              <FiInfo className="w-5.5 h-5.5 text-accent-custom flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-custom">CLASSIFIER TIP:</span> Bi-LSTM neural networks evaluate character sequence layouts, detecting obfuscation mutations, which standard regex/signature tokens frequently bypass.
              </div>
            </div>
          </div>
        </Card>

        {/* Center: Confusion Matrix Visualizer */}
        <Card title="Confusion Matrix Output" subtitle="Evaluation results parsed across validation validation subsets" className="lg:col-span-2">
          <div className="mt-4 flex flex-col items-center justify-center space-y-4">
            
            {/* The 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3.5 max-w-sm w-full select-none">
              
              {/* True Negatives */}
              <div className="aspect-square bg-green-500/10 border border-green-500/25 rounded-xl p-4.5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                <div>
                  <h5 className="text-[10px] font-bold text-green-500 uppercase">True Negatives (TN)</h5>
                  <p className="text-xs text-text-muted mt-1 leading-snug">Correctly Identified Safe Queries</p>
                </div>
                <p className="text-2xl font-bold font-mono text-text-custom">{model.tn.toLocaleString()}</p>
              </div>

              {/* False Positives */}
              <div className="aspect-square bg-red-500/10 border border-red-500/25 rounded-xl p-4.5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                <div>
                  <h5 className="text-[10px] font-bold text-red-500 uppercase">False Positives (FP)</h5>
                  <p className="text-xs text-text-muted mt-1 leading-snug">Safe Queries Flagged Attack</p>
                </div>
                <p className="text-2xl font-bold font-mono text-text-custom">{model.fp.toLocaleString()}</p>
              </div>

              {/* False Negatives */}
              <div className="aspect-square bg-orange-500/10 border border-orange-500/25 rounded-xl p-4.5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                <div>
                  <h5 className="text-[10px] font-bold text-orange-500 uppercase">False Negatives (FN)</h5>
                  <p className="text-xs text-text-muted mt-1 leading-snug">Attack queries classified Safe</p>
                </div>
                <p className="text-2xl font-bold font-mono text-text-custom">{model.fn.toLocaleString()}</p>
              </div>

              {/* True Positives */}
              <div className="aspect-square bg-blue-500/10 border border-blue-500/25 rounded-xl p-4.5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                <div>
                  <h5 className="text-[10px] font-bold text-blue-500 uppercase">True Positives (TP)</h5>
                  <p className="text-xs text-text-muted mt-1 leading-snug">Correctly Blocked SQL Injection</p>
                </div>
                <p className="text-2xl font-bold font-mono text-text-custom">{model.tp.toLocaleString()}</p>
              </div>

            </div>
            
            <p className="text-[10px] text-text-muted text-center max-w-sm leading-normal">
              A high True Positive/Negative value indicates successful classification. Minimizing False Negatives is critical to avoid SQLi bypass leakage.
            </p>
          </div>
        </Card>

      </div>

      {/* ROC Area Chart Visualization */}
      <ChartWrapper title="Receiver Operating Characteristic (ROC Curve)" subtitle="Visual representation of True Positive Rate (Sensitivity) vs False Positive Rate (1 - Specificity)">
        <AreaChart data={model.rocData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="fpr" label={{ value: 'False Positive Rate (FPR)', position: 'insideBottomRight', offset: -5, fill: textColor, fontSize: 10 }} stroke={textColor} fontSize={11} />
          <YAxis label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', offset: 10, fill: textColor, fontSize: 10 }} stroke={textColor} fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipTextColor }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Area type="monotone" dataKey="tpr" name={`${model.name} (AUC)`} stroke="#06b6d4" fillOpacity={0.15} fill="#06b6d4" strokeWidth={2.5} />
          <Area type="monotone" dataKey="random" name="Random Classifier Baseline" stroke="#64748b" fillOpacity={0} strokeWidth={1.5} strokeDasharray="5 5" />
        </AreaChart>
      </ChartWrapper>

    </div>
  );
};

export default AIDetection;
