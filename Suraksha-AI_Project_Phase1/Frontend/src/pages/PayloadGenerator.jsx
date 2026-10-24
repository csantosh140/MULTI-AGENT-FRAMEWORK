import React, { useState } from 'react';
import { FiCode, FiCopy, FiCheck, FiSliders, FiCpu, FiShield, FiAlertTriangle, FiTerminal } from 'react-icons/fi';

import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import { useNotification } from '../hooks/useNotification';
import { usePayload } from '../hooks/usePayload';

const PAYLOAD_CATEGORIES = [
  { key: 'basic', label: 'SQL Injection (Basic)', icon: '💉', desc: 'Simple auth-bypass and tautology boolean tests' },
  { key: 'advanced', label: 'SQL Injection (Advanced)', icon: '💉', desc: 'UNION schema extraction and time delay tests' },
  { key: 'broken_access_control', label: 'Broken Access Control', icon: '🔓', desc: 'IDOR, privilege tampering, and admin endpoint probes' },
  { key: 'xxe', label: 'XML / XXE Injection', icon: '', desc: 'SYSTEM external entities, DTDs, and protocol wrappers' },
  { key: 'command_injection', label: 'OS Command Injection', icon: '💻', desc: 'Piped shell commands, subshells, and reverse shells' },
  { key: 'xss', label: 'Cross-Site Scripting (XSS)', icon: '🧨', desc: 'DOM payloads, script tags, and event handlers' },
  { key: 'path_traversal', label: 'Path Traversal', icon: '📂', desc: 'Parent directory sequences (../) and system file access' },
  { key: 'ssrf', label: 'SSRF Attack Vectors', icon: '🌐', desc: 'Cloud metadata, 127.0.0.1 loopback, and private IPs' },
  { key: 'ldap', label: 'LDAP Injection', icon: '🗂', desc: 'Filter wildcards, OR/AND bypass, objectClass queries' },
  { key: 'header_injection', label: 'HTTP Header Injection', icon: '📨', desc: 'CRLF response splitting and host header injection' },
  { key: 'template_injection', label: 'Template Injection (SSTI)', icon: '🔧', desc: 'Jinja2, Twig, Freemarker, and Python introspection' },
  { key: 'open_redirect', label: 'Open Redirect', icon: '↩', desc: 'Malicious external redirect and protocol-relative URLs' },
  { key: 'random', label: 'Random Multi-Threat Mix', icon: '⚡', desc: 'Randomized audit vector across all categories' }
];

const PayloadGenerator = () => {
  const { showNotification } = useNotification();
  const {
    generatedPayload,
    history,
    loading: isLoading,
    generating: isGenerating,
    generatePayload
  } = usePayload();
  const [payloadType, setPayloadType] = useState('basic');
  const [mutationLevel, setMutationLevel] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setCopied(false);
    await generatePayload(payloadType, "medium", mutationLevel);
  };

  const handleCopy = () => {
    if (!generatedPayload || generatedPayload === "Select settings and click 'Generate Exploit Payload'") {
      showNotification('Generate a payload first', 'warning');
      return;
    }
    navigator.clipboard.writeText(generatedPayload);
    setCopied(true);
    showNotification('Payload copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const mutationsInfo = [
    { level: 0, label: 'Level 0: Raw Payload', desc: 'No mutation or encoding applied.' },
    { level: 1, label: 'Level 1: Case Modification', desc: 'Random uppercase/lowercase manipulation of keyword syntax.' },
    { level: 2, label: 'Level 2: Comment/Delimiter Obfuscation', desc: 'Converts spaces to inline comment brackets (/**/) or URL delimiters.' },
    { level: 3, label: 'Level 3: Hex URL Encoding', desc: 'Applies URL Hex Encoding to keywords and operators.' },
    { level: 4, label: 'Level 4: Double Hex Obfuscation', desc: 'Applies double URL encoding to test filter evasion resilience.' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight">Adversarial Multi-Threat Payload Generator</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Generate synthetic payloads across 11 OWASP attack vectors to benchmark WAF rules and Suraksha-AI classification resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Configurations Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Generator Settings" subtitle="Configure attack vectors and mutation strength">
            <div className="space-y-4 text-xs">
              
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-text-muted uppercase">Attack Category</label>
                <div className="flex flex-col space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {PAYLOAD_CATEGORIES.map((t) => (
                    <label
                      key={t.key}
                      className={`flex items-start space-x-2.5 p-2 rounded-lg border border-border-custom cursor-pointer transition ${
                        payloadType === t.key ? 'bg-primary-custom/10 border-accent-custom' : 'hover:bg-border-custom/25'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payloadType"
                        value={t.key}
                        checked={payloadType === t.key}
                        onChange={() => setPayloadType(t.key)}
                        className="mt-0.5 rounded-full text-accent-custom focus:ring-offset-0 focus:outline-none"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-text-custom flex items-center gap-1.5">
                          <span>{t.icon}</span> {t.label}
                        </span>
                        <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Slider for Mutation Level */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold text-text-muted uppercase">Mutation Severity</label>
                  <span className="font-mono text-accent-custom font-semibold">Level {mutationLevel}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={mutationLevel}
                  onChange={(e) => setMutationLevel(parseInt(e.target.value))}
                  className="w-full h-1 bg-border-custom rounded-lg appearance-none cursor-pointer accent-accent-custom"
                />
                
                {/* Information of mutation */}
                <div className="p-3 bg-bg-custom/50 border border-border-custom rounded-lg mt-2 text-[10.5px]">
                  <span className="font-bold text-text-custom">
                    {mutationsInfo[mutationLevel].label}:
                  </span>
                  <p className="text-text-muted mt-0.5">
                    {mutationsInfo[mutationLevel].desc}
                  </p>
                </div>
              </div>

              <Button
                variant="accent"
                onClick={handleGenerate}
                isLoading={isGenerating}
                disabled={isGenerating}
                className="w-full justify-center text-xs py-2.5 font-bold uppercase tracking-wider"
              >
                Compile Exploit Payload
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Generated Output Box */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Generated Exploit Payload Output" subtitle="Copy compiled payload to test target website defenses" className="h-full flex flex-col justify-between">
            <div className="flex-1 flex flex-col justify-between space-y-4">
              
              {/* Display Box */}
              <div className="relative flex-1 min-h-[140px] bg-bg-custom border border-border-custom rounded-xl p-4.5 font-mono text-xs text-red-500 dark:text-red-300 break-all select-all overflow-y-auto leading-relaxed">
                {generatedPayload || "Select settings and click 'Compile Exploit Payload'"}
              </div>

              {/* Warnings and Info */}
              <div className="p-4.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                <h5 className="text-xs font-semibold text-warning-custom uppercase flex items-center space-x-1.5">
                  <FiSliders />
                  <span>WAF Penetration & Defense Validation Notice</span>
                </h5>
                <p className="text-xs text-text-muted leading-relaxed">
                  These payloads are generated exclusively for defensive WAF benchmarking, security auditing, and machine learning model validation. Test your applications to ensure Suraksha-AI intercepts all OWASP attack vectors effectively.
                </p>
              </div>

              {/* Control Action Buttons */}
              <div className="flex justify-end pt-2 border-t border-border-custom/50">
                <Button
                  variant="secondary"
                  onClick={handleCopy}
                  icon={copied ? FiCheck : FiCopy}
                  className={copied ? 'text-green-500 border-green-500/30' : ''}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>

            </div>
          </Card>
        </div>

      </div>

      {/* History Table */}
      <div className="space-y-3 mt-6">
        <h2 className="text-base font-bold text-text-custom uppercase tracking-wide">
          Payload Compilation History
        </h2>
        <Table
          columns={[
            {
              header: 'Payload',
              key: 'payload',
              render: (_, val) => (
                <span className="font-mono text-xs bg-bg-custom border border-border-custom/50 px-2 py-1 rounded max-w-[400px] truncate block text-red-400 dark:text-red-300 select-all">
                  {val}
                </span>
              )
            },
            {
              header: 'Category',
              key: 'category',
              render: (row) => <span className="text-xs font-semibold text-text-custom">{row.category || row.payload_type}</span>
            },
            {
              header: 'Mutation Level',
              key: 'mutation_level',
              render: (_, val) => <span className="font-mono text-xs text-text-muted">Level {val}</span>
            },
            {
              header: 'Difficulty',
              key: 'difficulty',
              render: (_, val) => <span className="text-xs text-text-muted capitalize">{val}</span>
            },
            {
              header: 'Timestamp',
              key: 'timestamp',
              render: (row) => {
                const val = row.timestamp || row.created_at;
                const time = val ? new Date(val) : new Date();
                return <span className="font-mono text-xs text-text-muted">{time.toLocaleString()}</span>;
              }
            }
          ]}
          data={history}
          isLoading={isLoading}
          emptyMessage="No previously compiled payloads found."
        />
      </div>

    </div>
  );
};

export default PayloadGenerator;
