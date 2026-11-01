# Suraksha-AI Security & Testing Documentation Hub

This directory contains the official technical and operational documentation for the **Suraksha-AI Autonomous Web Defense Framework**.

---

## 📑 Included Reports & Guides

### 1. [Suraksha-AI Defense Agents & Operations Report](./suraksha_ai_defense_agents_report.md)
* **Audience**: Architects, Developers, Security Engineers.
* **Contents**:
  * Complete architecture and request lifecycle flowcharts.
  * **Tier 1: Core System Agents** (`TrafficMonitoringAgent`, `VulnerabilityDetectionAgent`, `SecurityDecisionAgent`, `IntrusionPreventionAgent`, `CyberThreatIntelAgent`, `IncidentReportAgent`).
  * **Tier 2: Specialized Multi-Threat Sentinel Agents** (11 sentinels for OWASP Top 10 vectors: SQLi, IDOR, SSRF, Crypto, Misconfiguration, etc.).
  * Latency profiles and gateway disposition rules.

---

### 2. [Vulnerability Verification & Defense Testing Guide](./suraksha_ai_vulnerability_testing_guide.md)
* **Audience**: QA Engineers, Security Testers, DevOps.
* **Contents**:
  * Technical benchmarking methodology across all 10 OWASP (2021) categories.
  * Detailed parameter contexts, headers, and AST inspection targets.
  * Programmatic testing via REST API endpoints (`/api/multi-threat/scan-payload` and `/api/multi-threat/scan`).
  * Results of the 97-vector compliance test runner (100% pass rate).

---

### 3. [Simple Step-by-Step Testing Demonstration](./easy_step_by_step_testing_demonstration.md)
* **Audience**: Non-technical users, Quick Demonstrations, Presentations.
* **Contents**:
  * Plain-English explanation of how Suraksha-AI guards web traffic.
  * Visual walkthrough of testing via the web UI (`http://localhost:5173/multi-threat`).
  * Copy-paste cheatsheet with 10 realistic test scenarios.
  * Quick 1-command automated terminal test runner (`python test_owasp_top10_suite.py`).

