// ==========================================================================
// ENTERPRISE TARGET PORTAL APP
// ==========================================================================

// Use relative API path (works seamlessly via Vite proxy or direct relative routing)
const API_BASE_URL = window.location.port === '3000' ? '/api' : 'http://127.0.0.1:5000/api';

let authToken = localStorage.getItem('enterprise_token') || localStorage.getItem('antigravity_token') || null;
let currentUser = JSON.parse(localStorage.getItem('enterprise_user') || localStorage.getItem('antigravity_user') || 'null');

// DOM Elements
const cardWrapper = document.getElementById('card-wrapper');
const authCard = document.getElementById('auth-card');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const tabDashboard = document.getElementById('tab-dashboard');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const quickDemoBtn = document.getElementById('quick-demo-btn');
const toggleLoginPwd = document.getElementById('toggle-login-pwd');

const dashAvatar = document.getElementById('dash-avatar');
const dashName = document.getElementById('dash-name');
const dashEmail = document.getElementById('dash-email');
const dashRole = document.getElementById('dash-role');
const logoutBtn = document.getElementById('logout-btn');

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundCanvas();
  init3DTilt();
  initTabs();
  initAuthLogic();
  checkSession();
});

// ==================== CLEAN ARCHITECTURAL BACKGROUND ====================
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

    // Subtle clean enterprise dot grid
    ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
    const spacing = 32;
    for (let x = 16; x < width; x += spacing) {
      for (let y = 16; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderGrid();
}

// ==================== STABLE PROFESSIONAL CARD DISPLAY ====================
function init3DTilt() {
  // Stable, static display for a professional enterprise feel
  if (authCard) {
    authCard.style.transform = 'none';
  }
}

// ==================== TABS ====================
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchTab(targetId);
    });
  });
}

function switchTab(targetId) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const activeTab = document.querySelector(`[data-tab="${targetId}"]`);
  const activePane = document.getElementById(targetId);

  if (activeTab) activeTab.classList.add('active');
  if (activePane) activePane.classList.add('active');

  if (cardWrapper) {
    if (targetId === 'dashboard-tab') {
      cardWrapper.classList.add('wide-mode');
    } else {
      cardWrapper.classList.remove('wide-mode');
    }
  }
}

// ==================== BACKEND AUTH LOGIC ====================
function initAuthLogic() {
  // Quick demo fill
  quickDemoBtn.addEventListener('click', () => {
    document.getElementById('login-email').value = 'admin@enterprise.com';
    document.getElementById('login-password').value = 'password123';
    showToast('Demo credentials pre-filled (admin@enterprise.com)', 'info');
  });

  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Enterprise records synced with database!', 'success');
      const queriesEl = document.getElementById('kpi-queries');
      if (queriesEl) {
        queriesEl.textContent = `${Math.floor(Math.random() * 200 + 300)} /s`;
      }
    });
  }

  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Exporting encrypted enterprise records to CSV...', 'info');
    });
  }

  // Password toggle eye icon
  toggleLoginPwd.addEventListener('click', () => {
    const pwdInput = document.getElementById('login-password');
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  });

  // Login Submit -> POST /api/login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const loginBtn = document.getElementById('login-btn');
    setLoading(loginBtn, true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      setLoading(loginBtn, false);

      if (res.ok && data.token) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('enterprise_token', authToken);
        localStorage.setItem('enterprise_user', JSON.stringify(currentUser));

        showToast('Sign in successful!', 'success');
        updateDashboardUI();
      } else {
        showToast(data.message || 'Authentication failed', 'error');
      }
    } catch (err) {
      setLoading(loginBtn, false);
      showToast('Connection error: Checking backend connectivity...', 'error');
    }
  });

  // Register Submit -> POST /api/register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const regBtn = document.getElementById('register-btn');
    setLoading(regBtn, true);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      setLoading(regBtn, false);

      if (res.ok && data.token) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('enterprise_token', authToken);
        localStorage.setItem('enterprise_user', JSON.stringify(currentUser));

        showToast('Account created and saved to database!', 'success');
        updateDashboardUI();
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      setLoading(regBtn, false);
      showToast('Backend connection error', 'error');
    }
  });

  // Logout -> POST /api/logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
      } catch (err) {}

      authToken = null;
      currentUser = null;
      localStorage.removeItem('enterprise_token');
      localStorage.removeItem('enterprise_user');
      localStorage.removeItem('antigravity_token');
      localStorage.removeItem('antigravity_user');

      const portalEl = document.getElementById('full-portal-dashboard');
      const authContEl = document.getElementById('auth-container');
      const topNavEl = document.querySelector('.top-nav');

      if (portalEl) portalEl.classList.add('hidden');
      if (authContEl) authContEl.classList.remove('hidden');
      if (topNavEl) topNavEl.classList.remove('hidden');

      showToast('Signed out successfully', 'info');
    });
  }

  // Live Table Search
  const tableSearchInput = document.getElementById('table-search');
  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#target-records-body tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

function checkSession() {
  if (authToken && currentUser) {
    updateDashboardUI();
  }
}

function updateDashboardUI() {
  if (!currentUser) return;
  const portalEl = document.getElementById('full-portal-dashboard');
  const authContEl = document.getElementById('auth-container');
  const topNavEl = document.querySelector('.top-nav');

  if (portalEl) portalEl.classList.remove('hidden');
  if (authContEl) authContEl.classList.add('hidden');
  if (topNavEl) topNavEl.classList.add('hidden');

  if (dashName) dashName.textContent = currentUser.name;
  if (dashEmail) dashEmail.textContent = currentUser.email;
  if (dashRole) dashRole.textContent = currentUser.role || 'System Admin';
  if (dashAvatar) dashAvatar.src = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
}

// ==================== TOAST & UTILS ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type]}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setLoading(button, isLoading) {
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

// ==================== REAL-TIME ATTACK VISUAL ANIMATION ====================
function animateAttackInLoginUI(payloadText) {
  if (!payloadText || payloadText === 'admin@enterprise.com' || payloadText === 'admin@antigravity.io' || payloadText === 'elena@enterprise.com' || payloadText === 'elena@antigravity.io') return;

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
  banner.innerHTML = `<span class="banner-pulse-dot"></span> <i class="fa-solid fa-triangle-exclamation"></i> <span>SURAKSHA-AI DETECTED SQL ATTACK:</span> <code>${payloadText}</code>`;
  document.body.appendChild(banner);

  setTimeout(() => {
    if (banner) banner.remove();
  }, 2200);

  // 3. Login Card Character-by-Character Auto-Typing Effect
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
      if (i < payloadText.length) {
        emailInput.value += payloadText.charAt(i);
        i++;
        emailInput.dataset.typingTimer = setTimeout(typeNextChar, 18);
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

  // 4. Target Application Audit Log Terminal Stream
  const auditTerm = document.getElementById('target-audit-terminal');
  if (auditTerm) {
    const now = new Date().toTimeString().split(' ')[0];
    const logLine = document.createElement('div');
    logLine.className = 'log-line';
    logLine.innerHTML = `<span class="time">${now}</span> <span class="tag warning">[INTERCEPTED]</span> SQLi Vector: <code>${payloadText}</code>`;
    auditTerm.appendChild(logLine);
    auditTerm.scrollTop = auditTerm.scrollHeight;
  }
}

// Global hook: Listen for incoming attack telemetry
window.triggerTargetAttackAnimation = function(payload) {
  animateAttackInLoginUI(payload);
};

// Initialize Live SSE Stream Listener from Target Server
function initLiveAttackStreamListener() {
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

initLiveAttackStreamListener();
