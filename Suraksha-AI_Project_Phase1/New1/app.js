// ==========================================================================
// APEXCORE ENTERPRISE CLOUD PLATFORM - CLIENT CONTROLLER
// ==========================================================================

const API_BASE_URL = window.location.port === '3000' ? '/api' : 'http://127.0.0.1:3001/api';

let authToken = localStorage.getItem('apex_token') || localStorage.getItem('enterprise_token') || null;
let currentUser = JSON.parse(localStorage.getItem('apex_user') || localStorage.getItem('enterprise_user') || 'null');

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundCanvas();
  initAuthTabSwitching();
  initAuthFormHandlers();
  initSidebarNavigation();
  initModals();
  initTableFilters();
  initLiveAttackStream();
  checkSessionState();
});

// ==================== BACKGROUND GRID ====================
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    renderGrid();
  });

  function renderGrid() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
    const spacing = 36;
    for (let x = 18; x < width; x += spacing) {
      for (let y = 18; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderGrid();
}

// ==================== AUTH TABS & PRE-FILL ====================
function initAuthTabSwitching() {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const boxLogin = document.getElementById('login-form-box');
  const boxRegister = document.getElementById('register-form-box');

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      boxLogin.classList.add('active');
      boxRegister.classList.remove('active');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      boxRegister.classList.add('active');
      boxLogin.classList.remove('active');
    });
  }

  const demoBtn = document.getElementById('quick-demo-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      document.getElementById('login-email').value = 'admin@enterprise.com';
      document.getElementById('login-password').value = 'password123';
      showToast('Demo enterprise credentials populated.', 'info');
    });
  }

  const pwdToggle = document.getElementById('toggle-login-pwd');
  if (pwdToggle) {
    pwdToggle.addEventListener('click', () => {
      const pwdInput = document.getElementById('login-password');
      pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    });
  }
}

// ==================== AUTH SUBMIT LOGIC ====================
function initAuthFormHandlers() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const logoutBtn = document.getElementById('logout-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      setLoadingState(btn, true);

      try {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        setLoadingState(btn, false);

        if (res.ok && data.token) {
          authToken = data.token;
          currentUser = data.user;
          localStorage.setItem('apex_token', authToken);
          localStorage.setItem('apex_user', JSON.stringify(currentUser));
          showToast(`Welcome back, ${currentUser.name}`, 'success');
          showPortalUI();
        } else {
          showToast(data.message || 'Authentication rejected by security policy', 'error');
        }
      } catch (err) {
        setLoadingState(btn, false);
        showToast('Connection error connecting to ApexCore server', 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const btn = document.getElementById('register-btn');
      setLoadingState(btn, true);

      try {
        const res = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        setLoadingState(btn, false);

        if (res.ok && data.token) {
          authToken = data.token;
          currentUser = data.user;
          localStorage.setItem('apex_token', authToken);
          localStorage.setItem('apex_user', JSON.stringify(currentUser));
          showToast('Account registered successfully in SQLite ledger', 'success');
          showPortalUI();
        } else {
          showToast(data.message || 'Registration rejected', 'error');
        }
      } catch (err) {
        setLoadingState(btn, false);
        showToast('Connection error', 'error');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
      } catch (err) {}

      authToken = null;
      currentUser = null;
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_user');
      localStorage.removeItem('enterprise_token');
      localStorage.removeItem('enterprise_user');

      document.getElementById('full-portal-dashboard').classList.add('hidden');
      document.getElementById('auth-view').classList.remove('hidden');
      showToast('Signed out of enterprise session.', 'info');
    });
  }
}

function checkSessionState() {
  if (authToken && currentUser) {
    showPortalUI();
  } else {
    document.getElementById('full-portal-dashboard').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('hidden');
  }
}

function showPortalUI() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('full-portal-dashboard').classList.remove('hidden');

  if (currentUser) {
    const nameEl = document.getElementById('dash-name');
    const roleEl = document.getElementById('dash-role');
    const avatarEl = document.getElementById('dash-avatar');

    if (nameEl) nameEl.textContent = currentUser.name;
    if (roleEl) roleEl.textContent = currentUser.role || 'System Administrator';
    if (avatarEl && currentUser.avatar) avatarEl.src = currentUser.avatar;
  }

  // Load all live application data
  loadAllPortalData();
}

// ==================== SIDEBAR TABS ====================
function initSidebarNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.getAttribute('data-tab');
      switchPortalTab(targetTabId);
    });
  });

  const viewLedgerBtn = document.getElementById('view-all-ledger-btn');
  if (viewLedgerBtn) {
    viewLedgerBtn.addEventListener('click', () => switchPortalTab('tab-ledger'));
  }

  const openCustOverview = document.getElementById('open-customer-btn-overview');
  if (openCustOverview) {
    openCustOverview.addEventListener('click', () => openModal('modal-add-customer'));
  }

  const openTransferOverview = document.getElementById('open-transfer-btn-overview');
  if (openTransferOverview) {
    openTransferOverview.addEventListener('click', () => openModal('modal-transfer'));
  }

  const refreshAllBtn = document.getElementById('refresh-all-btn');
  if (refreshAllBtn) {
    refreshAllBtn.addEventListener('click', () => {
      loadAllPortalData();
      showToast('All tables synced with SQLite database.', 'success');
    });
  }
}

function switchPortalTab(targetId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.portal-tab-pane').forEach(p => p.classList.remove('active'));

  const activeBtn = document.querySelector(`.sidebar-nav .nav-item[data-tab="${targetId}"]`);
  const activePane = document.getElementById(targetId);

  if (activeBtn) activeBtn.classList.add('active');
  if (activePane) activePane.classList.add('active');
}

// ==================== LOAD LIVE DATA FROM BACKEND ====================
async function loadAllPortalData() {
  loadMetrics();
  loadCustomers();
  loadTransactions();
  loadApiKeys();
  loadAuditLogs();
}

async function loadMetrics() {
  try {
    const res = await fetch(`${API_BASE_URL}/system/metrics`);
    const json = await res.json();
    if (json.success && json.metrics) {
      const m = json.metrics;
      const assetsEl = document.getElementById('kpi-total-assets');
      const accountsEl = document.getElementById('kpi-cust-accounts');
      const velocityEl = document.getElementById('kpi-velocity');

      if (assetsEl) assetsEl.textContent = `$${Number(m.total_assets).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (accountsEl) accountsEl.textContent = Number(m.customer_accounts).toLocaleString();
      if (velocityEl) velocityEl.textContent = m.api_velocity;
    }
  } catch (err) {}
}

async function loadCustomers() {
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  const search = document.getElementById('cust-search-input')?.value.trim() || '';
  const tier = document.getElementById('cust-tier-select')?.value || 'All';
  const status = document.getElementById('cust-status-select')?.value || 'All';

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tier !== 'All') params.append('tier', tier);
    if (status !== 'All') params.append('status', status);

    const res = await fetch(`${API_BASE_URL}/customers?${params.toString()}`);
    const json = await res.json();

    if (json.success && json.data) {
      const customers = json.data;
      const countPill = document.getElementById('nav-customer-count');
      if (countPill) countPill.textContent = customers.length;

      if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-table-msg">No customer records matching query.</td></tr>`;
        return;
      }

      tbody.innerHTML = customers.map(c => `
        <tr>
          <td><code class="code-id">${c.id}</code></td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td class="text-secondary">${escapeHtml(c.email)}</td>
          <td><span class="badge-tier tier-${c.tier.toLowerCase().replace(/\\s+/g, '-')}">${c.tier}</span></td>
          <td><strong class="text-money">$${Number(c.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
          <td><span class="badge-status status-${c.status.toLowerCase()}">${c.status}</span></td>
          <td><code class="code-ip">${c.last_ip || '127.0.0.1'}</code></td>
          <td>
            <button class="table-action-btn" onclick="quickTransferTo('${c.id}', '${escapeHtml(c.name)}')" title="Send Wire Transfer">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-table-msg text-danger">Failed to load customer records from server.</td></tr>`;
  }
}

async function loadTransactions() {
  const overviewBody = document.getElementById('overview-tx-body');
  const fullBody = document.getElementById('full-ledger-table-body');

  try {
    const res = await fetch(`${API_BASE_URL}/transactions`);
    const json = await res.json();

    if (json.success && json.data) {
      const txs = json.data;

      if (overviewBody) {
        overviewBody.innerHTML = txs.slice(0, 5).map(t => `
          <tr>
            <td><code class="code-id">${t.id}</code></td>
            <td class="truncate-cell">${escapeHtml(t.sender)}</td>
            <td class="truncate-cell"><strong>${escapeHtml(t.recipient)}</strong></td>
            <td><span class="text-money font-mono">$${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
            <td><span class="badge-status status-active">${t.status}</span></td>
          </tr>
        `).join('');
      }

      if (fullBody) {
        fullBody.innerHTML = txs.map(t => `
          <tr>
            <td><code class="code-id">${t.id}</code></td>
            <td>${escapeHtml(t.sender)}</td>
            <td><strong>${escapeHtml(t.recipient)}</strong></td>
            <td><strong class="text-money">$${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
            <td><span class="badge-tier tier-standard">${t.type}</span></td>
            <td><span class="badge-status status-active">${t.status}</span></td>
            <td class="text-secondary">${t.timestamp}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {}
}

async function loadApiKeys() {
  const tbody = document.getElementById('apikeys-table-body');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api-keys`);
    const json = await res.json();

    if (json.success && json.data) {
      tbody.innerHTML = json.data.map(k => `
        <tr>
          <td><code class="code-id">${k.id}</code></td>
          <td><strong>${escapeHtml(k.name)}</strong></td>
          <td><code class="code-key">${k.key_prefix}</code></td>
          <td><span class="scope-tag">${k.scopes}</span></td>
          <td><span class="badge-status status-active">${k.status}</span></td>
          <td class="text-secondary">${k.created_at}</td>
          <td class="text-secondary">${k.last_used}</td>
          <td>
            <button class="table-del-btn" onclick="revokeApiKey('${k.id}')" title="Revoke API Key">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {}
}

async function loadAuditLogs() {
  const fullBody = document.getElementById('audit-table-body');
  const termViewer = document.getElementById('overview-audit-stream');

  try {
    const res = await fetch(`${API_BASE_URL}/audit-logs`);
    const json = await res.json();

    if (json.success && json.data) {
      const logs = json.data;

      if (fullBody) {
        fullBody.innerHTML = logs.map(l => `
          <tr>
            <td><code class="code-id">${l.id}</code></td>
            <td class="text-secondary font-mono">${l.timestamp.split('T')[0] || l.timestamp}</td>
            <td><span class="badge-status status-${l.level === 'SUCCESS' ? 'verified' : l.level === 'INFO' ? 'active' : 'pending'}">${l.level}</span></td>
            <td><span class="badge-tier tier-standard">${l.category}</span></td>
            <td>${escapeHtml(l.message)}</td>
            <td><code class="code-ip">${l.ip_address || '127.0.0.1'}</code></td>
            <td class="text-secondary text-sm">${escapeHtml(l.user_agent ? l.user_agent.slice(0, 20) : 'System')}</td>
          </tr>
        `).join('');
      }

      if (termViewer && logs.length > 0) {
        termViewer.innerHTML = logs.slice(0, 8).map(l => {
          const time = l.timestamp.includes('T') ? l.timestamp.split('T')[1].slice(0, 8) : l.timestamp;
          const tagClass = l.level === 'SUCCESS' ? 'success' : l.level === 'WARNING' ? 'warning' : 'info';
          return `<div class="term-line"><span class="term-time">${time}</span> <span class="term-tag ${tagClass}">[${l.category}]</span> ${escapeHtml(l.message)}</div>`;
        }).join('');
      }
    }
  } catch (err) {}
}

// ==================== TABLE FILTERS & SEARCH ====================
function initTableFilters() {
  const searchInput = document.getElementById('cust-search-input');
  const tierSelect = document.getElementById('cust-tier-select');
  const statusSelect = document.getElementById('cust-status-select');
  const resetBtn = document.getElementById('reset-cust-filters-btn');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => loadCustomers(), 250));
  }

  if (tierSelect) {
    tierSelect.addEventListener('change', () => loadCustomers());
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => loadCustomers());
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (tierSelect) tierSelect.value = 'All';
      if (statusSelect) statusSelect.value = 'All';
      loadCustomers();
    });
  }

  const globalSearch = document.getElementById('global-search-input');
  if (globalSearch) {
    globalSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = globalSearch.value.trim();
        if (val) {
          switchPortalTab('tab-customers');
          if (searchInput) {
            searchInput.value = val;
            loadCustomers();
          }
        }
      }
    });
  }

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Generating signed enterprise CSV ledger export...', 'info');
      setTimeout(() => {
        showToast('Export downloaded: apexcore_ledger_export.csv', 'success');
      }, 1000);
    });
  }

  const exportAuditBtn = document.getElementById('export-audit-btn');
  if (exportAuditBtn) {
    exportAuditBtn.addEventListener('click', () => {
      showToast('Compiling tamper-evident audit trail...', 'info');
      setTimeout(() => {
        showToast('Audit trail exported: security_audit_trail.log', 'success');
      }, 1000);
    });
  }
}

// ==================== MODALS ====================
function initModals() {
  // Add Customer Modal
  const openAddCust = document.getElementById('open-add-customer-modal-btn');
  const closeCust = document.getElementById('close-cust-modal');
  const cancelCust = document.getElementById('cancel-cust-modal');
  const addCustForm = document.getElementById('add-customer-form');

  if (openAddCust) openAddCust.addEventListener('click', () => openModal('modal-add-customer'));
  if (closeCust) closeCust.addEventListener('click', () => closeModal('modal-add-customer'));
  if (cancelCust) cancelCust.addEventListener('click', () => closeModal('modal-add-customer'));

  if (addCustForm) {
    addCustForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cust-name-input').value.trim();
      const email = document.getElementById('cust-email-input').value.trim();
      const tier = document.getElementById('cust-tier-input').value;
      const balance = parseFloat(document.getElementById('cust-balance-input').value) || 0;
      const status = document.getElementById('cust-status-input').value;

      try {
        const res = await fetch(`${API_BASE_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, tier, balance, status })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showToast(json.message, 'success');
          closeModal('modal-add-customer');
          addCustForm.reset();
          loadCustomers();
          loadMetrics();
          loadAuditLogs();
        } else {
          showToast(json.message || 'Creation failed', 'error');
        }
      } catch (err) {
        showToast('Network error creating customer', 'error');
      }
    });
  }

  // Transfer Modal
  const openTransfer = document.getElementById('open-transfer-modal-btn');
  const closeTransfer = document.getElementById('close-transfer-modal');
  const cancelTransfer = document.getElementById('cancel-transfer-modal');
  const transferForm = document.getElementById('transfer-form');

  if (openTransfer) openTransfer.addEventListener('click', () => openModal('modal-transfer'));
  if (closeTransfer) closeTransfer.addEventListener('click', () => closeModal('modal-transfer'));
  if (cancelTransfer) cancelTransfer.addEventListener('click', () => closeModal('modal-transfer'));

  if (transferForm) {
    transferForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sender = document.getElementById('transfer-sender-input').value;
      const recipient = document.getElementById('transfer-recipient-input').value.trim();
      const amount = parseFloat(document.getElementById('transfer-amount-input').value);
      const type = document.getElementById('transfer-type-input').value;

      try {
        const res = await fetch(`${API_BASE_URL}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender, recipient, amount, type })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showToast(json.message, 'success');
          closeModal('modal-transfer');
          transferForm.reset();
          loadTransactions();
          loadAuditLogs();
        } else {
          showToast(json.message || 'Transfer failed', 'error');
        }
      } catch (err) {
        showToast('Network error executing transfer', 'error');
      }
    });
  }

  // API Key Modal
  const openKey = document.getElementById('open-key-modal-btn');
  const closeKey = document.getElementById('close-key-modal');
  const cancelKey = document.getElementById('cancel-key-modal');
  const keyForm = document.getElementById('apikey-form');

  if (openKey) openKey.addEventListener('click', () => openModal('modal-apikey'));
  if (closeKey) closeKey.addEventListener('click', () => closeModal('modal-apikey'));
  if (cancelKey) cancelKey.addEventListener('click', () => closeModal('modal-apikey'));

  if (keyForm) {
    keyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('key-name-input').value.trim();
      const scopes = document.getElementById('key-scopes-input').value;

      try {
        const res = await fetch(`${API_BASE_URL}/api-keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, scopes })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showToast(json.message, 'success');
          closeModal('modal-apikey');
          keyForm.reset();
          loadApiKeys();
        } else {
          showToast(json.message || 'Failed to mint key', 'error');
        }
      } catch (err) {
        showToast('Network error generating key', 'error');
      }
    });
  }
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

window.quickTransferTo = function(id, name) {
  switchPortalTab('tab-ledger');
  openModal('modal-transfer');
  const recipientInput = document.getElementById('transfer-recipient-input');
  if (recipientInput) recipientInput.value = `${name} (${id})`;
};

window.revokeApiKey = async function(id) {
  if (!confirm(`Are you sure you want to revoke API key ${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api-keys/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      showToast(json.message, 'success');
      loadApiKeys();
    }
  } catch (err) {
    showToast('Failed to revoke API key', 'error');
  }
};

// ==================== REAL-TIME ATTACK FLUCTUATION & SHAKE ANIMATIONS ====================
function animateAttackInLoginUI(payloadText) {
  if (!payloadText || payloadText === 'admin@enterprise.com' || payloadText === 'admin@antigravity.io' || payloadText === 'elena@enterprise.com' || payloadText === 'elena@antigravity.io') return;

  const cleanPayload = String(payloadText);

  // 1. Red Screen Vignette Flash
  let vignette = document.getElementById('screen-vignette');
  if (vignette) vignette.remove();
  vignette = document.createElement('div');
  vignette.id = 'screen-vignette';
  vignette.className = 'screen-vignette-flash';
  document.body.appendChild(vignette);
  setTimeout(() => { if (vignette) vignette.remove(); }, 1200);

  // 2. Fixed High-Visibility Top Alert Banner
  let banner = document.getElementById('attack-banner');
  if (banner) banner.remove();
  banner = document.createElement('div');
  banner.id = 'attack-banner';
  banner.className = 'attack-live-banner';
  banner.innerHTML = `
    <span class="banner-pulse-dot"></span>
    <i class="fa-solid fa-triangle-exclamation"></i>
    <span>SURAKSHA-AI DETECTED ATTACK:</span>
    <code>${escapeHtml(cleanPayload.slice(0, 48))}</code>
  `;
  document.body.appendChild(banner);

  setTimeout(() => {
    if (banner) banner.remove();
  }, 2400);

  // 3. Login Card Character-by-Character Auto-Typing Effect & Shake Fluctuation
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const authCardEl = document.getElementById('auth-card');

  if (emailInput && pwdInput) {
    if (emailInput.dataset.typingTimer) {
      clearTimeout(parseInt(emailInput.dataset.typingTimer));
    }

    if (authCardEl) {
      authCardEl.classList.remove('card-attack-shake');
      void authCardEl.offsetWidth; // trigger reflow
      authCardEl.classList.add('card-attack-shake');
    }

    emailInput.classList.add('input-attack-pulse');
    pwdInput.classList.add('input-attack-pulse');

    emailInput.value = '';
    let i = 0;
    
    function typeNextChar() {
      if (i < cleanPayload.length) {
        emailInput.value += cleanPayload.charAt(i);
        i++;
        emailInput.dataset.typingTimer = setTimeout(typeNextChar, 16);
      } else {
        setTimeout(() => {
          emailInput.classList.remove('input-attack-pulse');
          pwdInput.classList.remove('input-attack-pulse');
          if (authCardEl) authCardEl.classList.remove('card-attack-shake');
        }, 1200);
      }
    }

    typeNextChar();
  }

  // 4. Also shake portal dashboard if user is currently logged in
  const portalEl = document.getElementById('full-portal-dashboard');
  if (portalEl && !portalEl.classList.contains('hidden')) {
    portalEl.classList.remove('card-attack-shake');
    void portalEl.offsetWidth;
    portalEl.classList.add('card-attack-shake');
    setTimeout(() => {
      portalEl.classList.remove('card-attack-shake');
    }, 1200);
  }

  // 5. Append to terminal audit log stream
  const termViewer = document.getElementById('overview-audit-stream');
  if (termViewer) {
    const time = new Date().toTimeString().split(' ')[0];
    const logLine = document.createElement('div');
    logLine.className = 'term-line';
    logLine.innerHTML = `<span class="term-time">${time}</span> <span class="term-tag warning">[INTERCEPTED]</span> Attack Vector: <code>${escapeHtml(cleanPayload.slice(0, 42))}</code>`;
    termViewer.insertBefore(logLine, termViewer.firstChild);
  }
}

// Global hook
window.triggerTargetAttackAnimation = function(payload) {
  animateAttackInLoginUI(payload);
};

// ==================== LIVE ATTACK TELEMETRY SSE LISTENER ====================
function initLiveAttackStream() {
  try {
    const streamUrl = '/api/live-attacks-stream';
    console.log('📡 Connecting to live attack SSE stream at:', streamUrl);
    const evtSource = new EventSource(streamUrl);

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.payload) {
          console.log('🚨 Live attack broadcast received:', data.payload);
          animateAttackInLoginUI(data.payload);
        }
      } catch (err) {}
    };

    evtSource.onerror = () => {
      console.log('⚠️ SSE stream disconnected, reconnecting...');
    };
  } catch (e) {
    console.error('SSE connection error:', e);
  }
}

// ==================== UTILS ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setLoadingState(button, isLoading) {
  if (!button) return;
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.btn-spinner');
  if (isLoading) {
    if (text) text.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    button.disabled = true;
  } else {
    if (text) text.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
    button.disabled = false;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
