// ═══════════════════════════════════════════════════
//  VegiBill TN — app.js  (Router / Entry Point)
// ═══════════════════════════════════════════════════

// ── STATE ─────────────────────────────────────────────
const AppState = {
  currentTab: 'home',
  history: [],   // page stack for back navigation
};

// ── NAVIGATION ────────────────────────────────────────
function navigateTo(tab, params = {}) {
  // Update nav highlights
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  AppState.currentTab = tab;
  AppState.history = [{ tab, params }];
  renderPage(tab, params);
  updateBackBtn(false);
}

function pushPage(tab, params = {}) {
  AppState.history.push({ tab, params });
  renderPage(tab, params);
  updateBackBtn(true);
}

function goBack() {
  if (AppState.history.length > 1) {
    AppState.history.pop();
    const prev = AppState.history[AppState.history.length - 1];
    renderPage(prev.tab, prev.params);
    updateBackBtn(AppState.history.length > 1);
  }
}

function updateBackBtn(show) {
  const btn = document.getElementById('back-btn');
  btn.classList.toggle('hidden', !show);
}

// ── PAGE RENDERER ─────────────────────────────────────
function renderPage(tab, params = {}) {
  const container = document.getElementById('page-container');
  container.innerHTML = '';
  const actions = document.getElementById('header-actions');
  actions.innerHTML = '';

  switch (tab) {
    case 'home':        renderHome(container, params); break;
    case 'add-sale':    renderAddSale(container, params); break;
    case 'sales':       renderSales(container, params); break;
    case 'sale-detail': renderSaleDetail(container, params); break;
    case 'add-purchase':renderAddPurchase(container, params); break;
    case 'purchase':    renderPurchase(container, params); break;
    case 'purchase-detail': renderPurchaseDetail(container, params); break;
    case 'parties':     renderParties(container, params); break;
    case 'items':       renderItems(container, params); break;
    case 'admin':       renderAdmin(container, params); break;
    case 'party-detail':renderPartyDetail(container, params); break;
    case 'party-date':  renderPartyDate(container, params); break;
    default:            container.innerHTML = '<div class="page">Page not found</div>';
  }
}

// ── HEADER TITLE ──────────────────────────────────────
function setHeaderTitle(title, sub = '') {
  document.getElementById('header-title').innerHTML = `
    <span class="header-logo">🥬</span>
    <div>
      <div class="header-name">${esc(title)}</div>
      ${sub ? `<div class="header-sub">${esc(sub)}</div>` : ''}
    </div>`;
}

// ── INIT ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Set today's date in header
  const d = document.getElementById('header-date');
  if (d) d.textContent = new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  navigateTo('home');
});
