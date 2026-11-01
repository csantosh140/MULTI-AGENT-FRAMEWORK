import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET =
  process.env.JWT_SECRET || 'antigravity_open_secret_key_2026';

const SURAKSHA_URL =
  process.env.SURAKSHA_URL || 'http://127.0.0.1:5000';
const SURAKSHA_TIMEOUT_MS = 2500;

let totalRequests = 0;
const startTime = new Date();
const sseClients = [];

// ============================================================
// 1. REQUEST PARSING AND CORS
// ============================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Permit command-line and server-to-server requests without Origin.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use((req, res, next) => {
  totalRequests++;
  next();
});

// ============================================================
// 2. SQLITE DATABASE
// ============================================================

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('[Database] Connection failed:', err.message);
    return;
  }

  console.log('[Database] Connected to database.sqlite');
  initDatabaseSchema();
});

function initDatabaseSchema() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Standard User',
        avatar TEXT,
        created_at TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        tier TEXT DEFAULT 'Standard',
        balance REAL DEFAULT 0.0,
        status TEXT DEFAULT 'Active',
        last_ip TEXT,
        created_at TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        recipient TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT DEFAULT 'Wire Transfer',
        status TEXT DEFAULT 'Completed',
        timestamp TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        scopes TEXT DEFAULT 'read:write',
        status TEXT DEFAULT 'Active',
        created_at TEXT,
        last_used TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        level TEXT DEFAULT 'INFO',
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT
      )
    `, err => {
      if (err) {
        console.error('[Database] Schema initialization error:', err.message);
        return;
      }
      seedDefaultRecords();
    });
  });
}

function seedDefaultRecords() {
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) {
      console.error('[Database] Count error:', err.message);
      return;
    }

    db.run(
      "UPDATE users SET name = 'System Administrator', email = 'admin@enterprise.com' WHERE email = 'admin@antigravity.io'",
      err => { if (err) console.error('[Database] Migration error:', err.message); }
    );

    if (row && row.count === 0) {
      const now = new Date().toISOString();
      const seedUsers = [
        {
          id: 'usr_001',
          name: 'System Administrator',
          email: 'admin@enterprise.com',
          password: 'password123',
          role: 'System Administrator',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        },
        {
          id: 'usr_002',
          name: 'Elena Vance',
          email: 'elena@enterprise.com',
          password: 'securePassword2026',
          role: 'Lead Cloud Architect',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena'
        },
        {
          id: 'usr_003',
          name: 'Marcus Chen',
          email: 'marcus@enterprise.com',
          password: 'marcusPassWord!',
          role: 'Chief Security Officer',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus'
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, password, role, avatar, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of seedUsers) {
        stmt.run(u.id, u.name, u.email, u.password, u.role, u.avatar, now);
      }
      stmt.finalize();
    }
  });

  // Seed Customers if empty
  db.get('SELECT COUNT(*) AS count FROM customers', (err, row) => {
    if (!err && row && row.count === 0) {
      const customers = [
        ['CUST-9021', 'Sarah Jenkins', 's.jenkins@corp.net', 'Enterprise', 45200.00, 'Active', '10.0.4.12'],
        ['CUST-8834', 'Alex Vance', 'a.vance@techops.io', 'Executive', 128450.00, 'Verified', '192.168.1.45'],
        ['CUST-7712', 'David Miller', 'd.miller@fintech.com', 'Standard', 12900.00, 'Pending', '172.16.0.8'],
        ['CUST-6549', 'Marcus Wright', 'm.wright@enterprise.com', 'VIP Admin', 310000.00, 'Active', '127.0.0.1'],
        ['CUST-5421', 'Elena Rostova', 'elena@cybersec.org', 'Security Admin', 92150.00, 'Active', '10.200.5.88'],
        ['CUST-4310', 'Robert Chen', 'r.chen@globalpay.com', 'Enterprise', 215000.00, 'Verified', '198.51.100.14'],
        ['CUST-3298', 'Sophia Martinez', 's.martinez@cloudnet.io', 'Standard', 68400.00, 'Active', '203.0.113.50'],
        ['CUST-2187', 'James Wilson', 'j.wilson@apexsystems.com', 'Executive', 34500.00, 'Active', '192.0.2.77'],
        ['CUST-1076', 'Amanda Taylor', 'a.taylor@datacore.net', 'Enterprise', 175800.00, 'Verified', '10.0.2.15'],
        ['CUST-0965', 'Viktor Dragan', 'v.dragan@securenet.eu', 'VIP Admin', 540000.00, 'Active', '185.220.101.5'],
        ['CUST-0854', 'Linda Kovacs', 'l.kovacs@techcorp.de', 'Standard', 28900.00, 'Pending', '91.210.107.4'],
        ['CUST-0743', 'Tarun Patel', 't.patel@fintech.in', 'Executive', 412300.00, 'Active', '103.21.244.0']
      ];
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO customers (id, name, email, tier, balance, status, last_ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of customers) {
        stmt.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], now);
      }
      stmt.finalize();
    }
  });

  // Seed Transactions if empty
  db.get('SELECT COUNT(*) AS count FROM transactions', (err, row) => {
    if (!err && row && row.count === 0) {
      const txs = [
        ['TX-99821', 'Corporate Escrow Vault', 'Sarah Jenkins (CUST-9021)', 15000.00, 'ACH Clearance', 'Completed', '10 mins ago'],
        ['TX-99820', 'Alex Vance (CUST-8834)', 'Apex High-Yield Yield Fund', 54000.00, 'Wire Transfer', 'Completed', '28 mins ago'],
        ['TX-99819', 'Global Clearinghouse', 'Robert Chen (CUST-4310)', 25000.00, 'SWIFT International', 'Completed', '1 hour ago'],
        ['TX-99818', 'Marcus Wright (CUST-6549)', 'Internal Hedge Allocation', 120000.00, 'Treasury Rebalance', 'Completed', '2 hours ago'],
        ['TX-99817', 'Tarun Patel (CUST-0743)', 'FinTech Prime Services', 45000.00, 'Fedwire Instant', 'Completed', '3 hours ago']
      ];
      const stmt = db.prepare(`
        INSERT INTO transactions (id, sender, recipient, amount, type, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of txs) {
        stmt.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6]);
      }
      stmt.finalize();
    }
  });

  // Seed API Keys if empty
  db.get('SELECT COUNT(*) AS count FROM api_keys', (err, row) => {
    if (!err && row && row.count === 0) {
      const keys = [
        ['key_live_01', 'Production Gateway Primary', 'pk_live_9a8f2...', 'ledger:read,ledger:write,transfers:exec', 'Active', '2026-01-15', '12 mins ago'],
        ['key_live_02', 'Telemetry Webhook Sentry', 'pk_live_4b7c1...', 'telemetry:emit,audit:read', 'Active', '2026-02-01', 'Just now'],
        ['key_test_03', 'Staging Integration Key', 'pk_test_8d2e5...', 'sandbox:all', 'Active', '2026-03-10', '2 days ago']
      ];
      const stmt = db.prepare(`
        INSERT INTO api_keys (id, name, key_prefix, scopes, status, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const k of keys) {
        stmt.run(k[0], k[1], k[2], k[3], k[4], k[5], k[6]);
      }
      stmt.finalize();
    }
  });

  // Seed Audit Logs if empty
  db.get('SELECT COUNT(*) AS count FROM audit_logs', (err, row) => {
    if (!err && row && row.count === 0) {
      const logs = [
        ['log_01', new Date(Date.now() - 3600000).toISOString(), 'INFO', 'SYSTEM', 'Production Gateway initialized with SQLite engine', '127.0.0.1', 'Node.js/v20'],
        ['log_02', new Date(Date.now() - 2400000).toISOString(), 'INFO', 'SECURITY', 'Suraksha-AI WAF reverse telemetry bridge armed', '127.0.0.1', 'SurakshaAgent/2.0'],
        ['log_03', new Date(Date.now() - 1200000).toISOString(), 'INFO', 'AUTH', 'Enterprise session authorized for admin@enterprise.com', '127.0.0.1', 'Mozilla/5.0 Chrome/120'],
        ['log_04', new Date(Date.now() - 300000).toISOString(), 'SUCCESS', 'DATABASE', 'Reconciliation ledger verified (12 customer records, 0 anomalies)', '127.0.0.1', 'System/Internal']
      ];
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, timestamp, level, category, message, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const l of logs) {
        stmt.run(l[0], l[1], l[2], l[3], l[4], l[5], l[6]);
      }
      stmt.finalize();
    }
  });
}

// ============================================================
// 3. JWT AUTHENTICATION
// ============================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization token provided'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Token invalid or expired'
      });
    }

    req.user = user;
    next();
  });
}

// ============================================================
// 4. SANITIZE DATA BEFORE SENDING IT TO SURAKSHA
// ============================================================

function sanitizeForInspection(value) {
  // Pass intact request structures so Suraksha-AI WAF can analyze SQLi, XXE, Command Injection, and SSTI
  return value;
}

// ============================================================
// 5. SURAKSHA AI INSPECTION CLIENT
// ============================================================

function inspectRequestWithSuraksha(req) {
  return new Promise((resolve, reject) => {
    let inspectionUrl;

    try {
      inspectionUrl = new URL(
        '/api/target/telemetry',
        SURAKSHA_URL
      );
    } catch {
      return reject(new Error('Invalid SURAKSHA_URL'));
    }

    // This local integration currently uses the Flask HTTP service.
    if (inspectionUrl.protocol !== 'http:') {
      return reject(
        new Error('SURAKSHA_URL must use HTTP for this local setup')
      );
    }

    const safeHeaders = {};

    for (const [name, value] of Object.entries(req.headers)) {
      const lowerName = name.toLowerCase();

      if (
        [
          'authorization',
          'cookie',
          'set-cookie',
          'proxy-authorization',
          'x-api-key',
          'origin',
          'referer',
          'host',
          'connection',
          'sec-ch-ua',
          'sec-ch-ua-mobile',
          'sec-ch-ua-platform',
          'sec-fetch-dest',
          'sec-fetch-mode',
          'sec-fetch-site',
          'accept-encoding',
          'accept-language',
          'content-length',
          'content-type'
        ].includes(lowerName)
      ) {
        continue;
      }

      safeHeaders[name] = value;
    }

    const postData = JSON.stringify({
      source_app: 'New1 Target App',
      url: req.originalUrl.split('?')[0],
      method: req.method,
      payload: {
        body: sanitizeForInspection(req.body || {}),
        query: sanitizeForInspection(req.query || {})
      },
      headers: safeHeaders,
      client_ip: req.ip || req.socket?.remoteAddress || '127.0.0.1',
      user_agent: req.headers['user-agent'] || ''
    });

    const options = {
      hostname: inspectionUrl.hostname,
      port: inspectionUrl.port || 80,
      path: inspectionUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: SURAKSHA_TIMEOUT_MS
    };

    const inspectionReq = http.request(options, inspectionRes => {
      let responseBody = '';

      inspectionRes.setEncoding('utf8');

      inspectionRes.on('data', chunk => {
        responseBody += chunk;
      });

      inspectionRes.on('end', () => {
        let result;

        try {
          result = JSON.parse(responseBody);
        } catch {
          return reject(
            new Error('Invalid JSON response from Suraksha AI')
          );
        }

        const decision = result?.data;

        if (
          inspectionRes.statusCode === 403 ||
          decision?.blocked === true ||
          decision?.verdict === 'BLOCKED'
        ) {
          return resolve({
            blocked: true,
            reason:
              decision?.reason ||
              result?.message ||
              'Threat blocked by Suraksha AI'
          });
        }

        if (
          inspectionRes.statusCode < 200 ||
          inspectionRes.statusCode >= 300 ||
          typeof decision?.blocked !== 'boolean'
        ) {
          return reject(
            new Error(
              `Unexpected Suraksha response: ${inspectionRes.statusCode}`
            )
          );
        }

        resolve({
          blocked: false,
          riskScore: decision.risk_score ?? 0
        });
      });
    });

    inspectionReq.setTimeout(SURAKSHA_TIMEOUT_MS, () => {
      inspectionReq.destroy(
        new Error('Suraksha inspection timed out')
      );
    });

    inspectionReq.on('error', reject);
    inspectionReq.write(postData);
    inspectionReq.end();
  });
}

// ============================================================
// 6. SURAKSHA AI API PROTECTION MIDDLEWARE
// ============================================================

app.use('/api', async (req, res, next) => {
  // Health and SSE endpoints are excluded from payload inspection.
  // CORS middleware handles preflight requests.
  if (
    req.method === 'OPTIONS' ||
    req.path === '/health' ||
    req.path === '/live-attacks-stream'
  ) {
    return next();
  }

  try {
    const verdict = await inspectRequestWithSuraksha(req);

    if (verdict.blocked) {
      console.warn(
        `[SURAKSHA BLOCK] ${req.method} ${req.path}: ${verdict.reason}`
      );

      // Extract attack payload text from body or query to trigger live UI attack shake
      const attackPayload =
        req.body?.email ||
        req.body?.username ||
        req.body?.password ||
        req.body?.query ||
        req.query?.email ||
        req.query?.q ||
        req.query?.query ||
        (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

      broadcastAttackToBrowsers({
        status: 'BLOCKED',
        payload: attackPayload,
        reason: verdict.reason,
        method: req.method,
        path: req.path
      });

      return res.status(403).json({
        error: 'Security Threat Intercepted',
        blocked: true,
        suraksha_verdict: 'BLOCKED',
        message: verdict.reason
      });
    }

    console.log(
      `[SURAKSHA ALLOW] ${req.method} ${req.path} | Risk: ${verdict.riskScore}`
    );

    return next();
  } catch (err) {
    console.error(
      `[SURAKSHA UNAVAILABLE] ${req.method} ${req.path}: ${err.message}`
    );

    // Fail closed: do not execute the API handler if inspection fails.
    return res.status(503).json({
      error: 'Security Inspection Unavailable',
      message:
        'The request was not processed because security inspection failed.'
    });
  }
});

// ============================================================
// 7. ROOT STATUS PAGE
// ============================================================

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New1 API Server</title>
      <style>
        body {
          font-family: system-ui, sans-serif;
          background: #070913;
          color: white;
          display: grid;
          place-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .card {
          padding: 36px;
          border: 1px solid #334155;
          border-radius: 16px;
          max-width: 480px;
        }
        h1 { color: #00f2fe; }
        p { color: #cbd5e1; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>New1 API Server</h1>
        <p>Status: Online</p>
        <p>Express port: ${PORT}</p>
        <p>Database: SQLite</p>
        <p>Suraksha AI: Request inspection enabled for applicable API routes</p>
        <p>Frontend: <a href="http://localhost:3000">Open New1</a></p>
      </div>
    </body>
    </html>
  `);
});

// ============================================================
// 8. HEALTH ENDPOINT
// ============================================================

app.get('/api/health', (req, res) => {
  db.get('SELECT COUNT(*) AS totalUsers FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Database health check failed'
      });
    }

    res.json({
      status: 'online',
      serverPort: PORT,
      database: 'SQLite (database.sqlite)',
      databaseRecords: row?.totalUsers ?? 0,
      corsPolicy: 'Configured allowed origins',
      uptimeSeconds: Math.floor(
        (Date.now() - startTime.getTime()) / 1000
      ),
      totalRequestsReceived: totalRequests
    });
  });
});

// ============================================================
// 9. LIVE ATTACK EVENT STREAM
// ============================================================

app.get('/api/live-attacks-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('data: {"status":"connected"}\n\n');

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);

    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

function broadcastAttackToBrowsers(eventData) {
  let payloadObj;
  if (typeof eventData === 'string') {
    payloadObj = { status: eventData, time: new Date().toISOString() };
  } else {
    payloadObj = { time: new Date().toISOString(), ...eventData };
  }

  const data = JSON.stringify(payloadObj);

  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {}
  }
}

// ============================================================
// 10. LOGIN
// ============================================================

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing Fields',
      message: 'Please provide email address and password'
    });
  }

  // Do not broadcast credentials to browser clients.
  broadcastAttackToBrowsers('LOGIN_ATTEMPT');

  db.get(
    'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR (LOWER(?) IN ("admin@enterprise.com", "admin@antigravity.io") AND LOWER(email) IN ("admin@enterprise.com", "admin@antigravity.io"))',
    [email, email],
    (err, user) => {
      if (err) {
        console.error('[Login] Database error:', err.message);

        return res.status(500).json({
          error: 'Database Error',
          message: 'Internal server query error'
        });
      }

      if (!user || user.password !== password) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid email or password credentials'
        });
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Login successful!',
        token: accessToken,
        tokenType: 'Bearer',
        expiresIn: '24 Hours',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        clientOrigin: req.headers.origin || 'Direct API Call',
        serverPort: PORT
      });
    }
  );
});

// ============================================================
// 11. REGISTRATION
// ============================================================

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Missing Fields',
      message: 'Name, email, and password are required'
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      error: 'Weak Password',
      message: 'Password must contain at least 8 characters'
    });
  }

  db.get(
    'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
    [email],
    (err, existing) => {
      if (err) {
        return res.status(500).json({
          error: 'Database Error',
          message: 'Database check failed'
        });
      }

      if (existing) {
        return res.status(409).json({
          error: 'User Exists',
          message: 'A user with this email already exists'
        });
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        name: String(name).trim(),
        email: String(email).trim(),
        password,
        role: 'Standard User',
        avatar:
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        created_at: new Date().toISOString()
      };

      db.run(
        `INSERT INTO users
        (id, name, email, password, role, avatar, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newUser.id,
          newUser.name,
          newUser.email,
          newUser.password,
          newUser.role,
          newUser.avatar,
          newUser.created_at
        ],
        function (insertErr) {
          if (insertErr) {
            console.error(
              '[Registration] Insert error:',
              insertErr.message
            );

            return res.status(500).json({
              error: 'Database Error',
              message: 'Failed to create user'
            });
          }

          const accessToken = jwt.sign(
            {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.status(201).json({
            success: true,
            message: 'User account created successfully',
            token: accessToken,
            tokenType: 'Bearer',
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              avatar: newUser.avatar
            },
            clientOrigin: req.headers.origin || 'Direct API Call'
          });
        }
      );
    }
  );
});

// ============================================================
// 12. AUTHENTICATED USER PROFILE
// ============================================================

app.get('/api/user', authenticateToken, (req, res) => {
  db.get(
    `SELECT id, name, email, role, avatar, created_at
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Database Error',
          message: 'Could not retrieve user profile'
        });
      }

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User profile not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.created_at
        },
        clientOrigin: req.headers.origin || 'Direct API Call',
        accessedAt: new Date().toISOString()
      });
    }
  );
});

// ============================================================
// 13. LOGOUT
// ============================================================

app.post('/api/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully!',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 14. ENTERPRISE CUSTOMERS & LEDGER ENDPOINTS
// ============================================================

// List customers with optional search & tier filters
app.get('/api/customers', (req, res) => {
  const search = req.query.search ? `%${req.query.search.trim()}%` : null;
  const tier = req.query.tier && req.query.tier !== 'All' ? req.query.tier : null;
  const status = req.query.status && req.query.status !== 'All' ? req.query.status : null;

  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR id LIKE ?)';
    params.push(search, search, search);
  }
  if (tier) {
    query += ' AND tier = ?';
    params.push(tier);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY balance DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database Error', message: err.message });
    }
    res.json({ success: true, count: rows.length, data: rows });
  });
});

// Add new customer account
app.post('/api/customers', (req, res) => {
  const { name, email, tier, balance, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Validation Error', message: 'Name and email are required.' });
  }

  const id = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
  const clientIp = req.ip || req.socket?.remoteAddress || '10.0.8.22';
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO customers (id, name, email, tier, balance, status, last_ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, name, email, tier || 'Standard', Number(balance) || 0.0, status || 'Active', clientIp, now, function(err) {
    if (err) {
      return res.status(400).json({ error: 'Conflict Error', message: err.message });
    }

    // Add audit log
    db.run(
      'INSERT INTO audit_logs (id, timestamp, level, category, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`log_${Date.now()}`, now, 'INFO', 'ACCOUNT', `Created customer ${name} (${id})`, clientIp, req.headers['user-agent'] || '']
    );

    res.status(201).json({
      success: true,
      message: `Customer account ${id} successfully initialized.`,
      customer: { id, name, email, tier: tier || 'Standard', balance: Number(balance) || 0.0, status: status || 'Active', last_ip: clientIp }
    });
  });
  stmt.finalize();
});

// List financial transactions
app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY rowid DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database Error', message: err.message });
    }
    res.json({ success: true, count: rows.length, data: rows });
  });
});

// Post a new financial transfer
app.post('/api/transactions', (req, res) => {
  const { sender, recipient, amount, type } = req.body;
  const numAmount = Number(amount);

  if (!recipient || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid Amount', message: 'Valid positive amount and recipient are required.' });
  }

  const id = `TX-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = 'Just now';

  const stmt = db.prepare(`
    INSERT INTO transactions (id, sender, recipient, amount, type, status, timestamp)
    VALUES (?, ?, ?, ?, ?, 'Completed', ?)
  `);

  stmt.run(id, sender || 'Corporate Treasury Vault', recipient, numAmount, type || 'Wire Transfer', now, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Transfer Failed', message: err.message });
    }

    // Add audit log
    const isoNow = new Date().toISOString();
    db.run(
      'INSERT INTO audit_logs (id, timestamp, level, category, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`log_${Date.now()}`, isoNow, 'SUCCESS', 'LEDGER', `Transferred $${numAmount.toLocaleString()} to ${recipient} (${id})`, req.ip || '127.0.0.1', req.headers['user-agent'] || '']
    );

    res.status(201).json({
      success: true,
      message: `Transfer ${id} executed successfully.`,
      transaction: { id, sender: sender || 'Corporate Treasury Vault', recipient, amount: numAmount, status: 'Completed', timestamp: now }
    });
  });
  stmt.finalize();
});

// List API keys
app.get('/api/api-keys', (req, res) => {
  db.all('SELECT * FROM api_keys ORDER BY rowid DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database Error', message: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

// Create new API key
app.post('/api/api-keys', (req, res) => {
  const { name, scopes } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Validation Error', message: 'Key name is required.' });
  }

  const randHex = Math.random().toString(16).substring(2, 10);
  const id = `key_${Date.now()}`;
  const keyPrefix = `pk_live_${randHex}...`;
  const now = new Date().toISOString().split('T')[0];

  db.run(
    'INSERT INTO api_keys (id, name, key_prefix, scopes, status, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, keyPrefix, scopes || 'ledger:read', 'Active', now, 'Never'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database Error', message: err.message });
      }
      res.status(201).json({
        success: true,
        message: 'New API token minted.',
        key: { id, name, key_prefix: keyPrefix, scopes: scopes || 'ledger:read', status: 'Active', created_at: now, last_used: 'Never' }
      });
    }
  );
});

// Revoke API key
app.delete('/api/api-keys/:id', (req, res) => {
  db.run('DELETE FROM api_keys WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database Error', message: err.message });
    }
    res.json({ success: true, message: `Key ${req.params.id} revoked.` });
  });
});

// List audit logs
app.get('/api/audit-logs', (req, res) => {
  db.all('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 50', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database Error', message: err.message });
    }
    res.json({ success: true, data: rows });
  });
});

// Enterprise System Metrics
app.get('/api/system/metrics', (req, res) => {
  db.get('SELECT COUNT(*) as customer_count, SUM(balance) as total_assets FROM customers', (err, custRow) => {
    db.get('SELECT COUNT(*) as tx_count FROM transactions', (err, txRow) => {
      res.json({
        success: true,
        metrics: {
          total_assets: custRow?.total_assets || 14850200,
          customer_accounts: custRow?.customer_count || 12,
          total_transactions: txRow?.tx_count || 5,
          api_velocity: `${Math.floor(1380 + Math.random() * 80)} req/s`,
          query_latency: '1.2 ms',
          engine: 'SQLite v3.42 + Suraksha-AI Shield'
        }
      });
    });
  });
});

// ============================================================
// 14. ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Origin Denied'
    });
  }

  console.error('[Express Error]', err.message);

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: 'The server could not process this request'
  });
});

// ============================================================
// 15. START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================');
  console.log(' New1 Express API Server');
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://127.0.0.1:${PORT}/api/health`);
  console.log(` Suraksha: ${SURAKSHA_URL}`);
  console.log('==============================================');
});