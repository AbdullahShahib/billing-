// ═══════════════════════════════════════════════════
//  VegiBill TN — pages/parties.js
// ═══════════════════════════════════════════════════

// ── PARTIES LIST ──────────────────────────────────────
function renderParties(container) {
  setHeaderTitle('Parties', 'Supplier ledger');

  const parties = DB.getParties();
  const purchases = DB.getPurchases();

  const partyTotals = {};
  purchases.forEach(p => {
    if (p.partyId) {
      partyTotals[p.partyId] = (partyTotals[p.partyId] || 0) + Number(p.grandTotal || 0);
    }
  });

  container.innerHTML = `
    <div class="search-wrap" style="padding-top:12px;">
      <div class="search-input">
        <input type="text" id="party-search" placeholder="Search party name, mobile..." oninput="_filterParties()" />
      </div>
    </div>

    <div style="padding:0 12px 10px;display:flex;gap:8px;">
      <button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="_openAddPartyModal()">+ Add Party</button>
    </div>

    <div id="parties-list" style="padding:0 12px;">
      ${parties.length === 0
        ? `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No parties yet</div><div class="empty-sub">Add your first supplier</div><button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="_openAddPartyModal()">+ Add Party</button></div>`
        : parties.map(p => `
          <div class="list-item" onclick="pushPage('party-detail',{partyId:'${p.id}'})" id="party-card-${p.id}">
            <div class="list-avatar" style="background:var(--blue-bg);">👤</div>
            <div class="list-info">
              <div class="list-title">${esc(p.name)}</div>
              <div class="list-sub">${p.mobile ? '📞 '+esc(p.mobile) : ''} ${p.address ? '· '+esc(p.address) : ''}</div>
            </div>
            <div class="list-right">
              <div class="list-amount text-amber">${fmtCurrency(partyTotals[p.id]||0)}</div>
              <div class="list-date">Total Purchases</div>
              <div style="color:var(--text3);font-size:11px;margin-top:2px;">→</div>
            </div>
          </div>`).join('')
      }
    </div>`;
}

function _filterParties() {
  const q = document.getElementById('party-search')?.value?.toLowerCase() || '';
  const parties = DB.getParties();
  document.querySelectorAll('[id^="party-card-"]').forEach(el => {
    const id = el.id.replace('party-card-', '');
    const p = parties.find(x => x.id === id);
    el.style.display = (p && (p.name.toLowerCase().includes(q) || (p.mobile||'').includes(q))) ? '' : 'none';
  });
}

function _openAddPartyModal(editId = null) {
  const party = editId ? DB.getPartyById(editId) : null;
  openModal(`
    <div class="modal-title">
      ${party ? 'Edit Party' : 'Add New Party'}
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">Party / Supplier Name *</label>
      <input type="text" id="m-party-name" placeholder="e.g. Rajan Vegetables" value="${party ? esc(party.name) : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Mobile Number</label>
      <input type="tel" id="m-party-mobile" placeholder="10-digit mobile" maxlength="10" value="${party ? esc(party.mobile||'') : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Address</label>
      <input type="text" id="m-party-address" placeholder="Market / Town" value="${party ? esc(party.address||'') : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">GSTIN (Optional)</label>
      <input type="text" id="m-party-gstin" placeholder="33XXXXX..." value="${party ? esc(party.gstin||'') : ''}" />
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button class="btn btn-secondary flex-1" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary flex-1" onclick="_saveParty('${editId||''}')">💾 Save Party</button>
    </div>
  `);
  setTimeout(() => document.getElementById('m-party-name')?.focus(), 100);
}

function _saveParty(editId) {
  const name = document.getElementById('m-party-name')?.value?.trim();
  if (!name) { showToast('⚠️ Party name required!'); return; }
  const party = {
    id: editId || undefined,
    name,
    mobile: document.getElementById('m-party-mobile')?.value?.trim(),
    address: document.getElementById('m-party-address')?.value?.trim(),
    gstin: document.getElementById('m-party-gstin')?.value?.trim(),
  };
  DB.saveParty(party);
  closeModal();
  showToast('✅ Party saved!');
  renderParties(document.getElementById('page-container'));
}

// ── PARTY DETAIL ──────────────────────────────────────
function renderPartyDetail(container, params) {
  const party = DB.getPartyById(params.partyId);
  if (!party) { container.innerHTML = '<div class="page empty-state"><div class="empty-icon">❌</div><div class="empty-title">Party not found</div></div>'; return; }

  setHeaderTitle(party.name, party.mobile || 'Supplier');

  document.getElementById('header-actions').innerHTML = `
    <button class="btn btn-secondary btn-sm" onclick="_openAddPartyModal('${party.id}')">✏️ Edit</button>`;

  const purchases = DB.getPurchases().filter(p => p.partyId === party.id);
  const totalPurchased = purchases.reduce((s, p) => s + Number(p.grandTotal || 0), 0);

  // Group by date
  const groups = groupByDate(purchases);
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const dateRows = dates.map(date => {
    const dayBills = groups[date];
    const dayTotal = dayBills.reduce((s, b) => s + Number(b.grandTotal || 0), 0);
    // Check if there's a custom balance override
    const customBal = DB.getPartyBalance(party.id, date);
    const displayBal = customBal !== undefined ? customBal : dayTotal;

    return `
      <div class="party-date-row" onclick="pushPage('party-date',{partyId:'${party.id}',date:'${date}'})">
        <div>
          <div style="font-weight:700;font-size:14px;">${fmtDateKey(date)}</div>
          <div style="font-size:12px;color:var(--text3);">${dayBills.length} purchase${dayBills.length>1?'s':''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:15px;font-weight:800;color:var(--amber);">${fmtCurrency(dayTotal)}</div>
          ${customBal !== undefined ? `<div style="font-size:11px;color:var(--green);">Balance: ${fmtCurrency(customBal)}</div>` : ''}
          <div style="font-size:11px;color:var(--text3);">→</div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <!-- PARTY INFO CARD -->
    <div class="card" style="margin:12px 12px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:52px;height:52px;background:var(--blue-bg);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>
        <div class="flex-1">
          <div style="font-size:17px;font-weight:800;">${esc(party.name)}</div>
          ${party.mobile ? `<div style="color:var(--text3);font-size:13px;">📞 ${esc(party.mobile)}</div>` : ''}
          ${party.address ? `<div style="color:var(--text3);font-size:12px;">📍 ${esc(party.address)}</div>` : ''}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:var(--bg3);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:700;">Total Purchased</div>
          <div style="font-size:18px;font-weight:800;color:var(--amber);">${fmtCurrency(totalPurchased)}</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:700;">Total Bills</div>
          <div style="font-size:18px;font-weight:800;">${purchases.length}</div>
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div style="display:flex;gap:8px;padding:10px 12px;">
      <button class="btn btn-amber flex-1 btn-sm" onclick="pushPage('add-purchase',{defaultParty:'${party.id}'})">+ New Purchase</button>
      <button class="btn btn-danger btn-sm" onclick="confirmModal('Delete party ${esc(party.name)}?',function(){DB.deleteParty('${party.id}');showToast('Deleted');navigateTo('parties');})">🗑 Delete</button>
    </div>

    <!-- DATE-WISE LEDGER -->
    <div class="font-bold text-sm text-muted" style="padding:6px 12px 8px;text-transform:uppercase;letter-spacing:.5px;">Purchase History</div>
    <div style="padding:0 12px 20px;">
      ${dates.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No purchases yet</div></div>`
        : dateRows
      }
    </div>`;
}

// ── PARTY DATE DETAIL ─────────────────────────────────
function renderPartyDate(container, params) {
  const party = DB.getPartyById(params.partyId);
  const dateKey = params.date;
  if (!party || !dateKey) return;

  setHeaderTitle(party.name, fmtDateKey(dateKey));

  const purchases = DB.getPurchases().filter(p =>
    p.partyId === party.id && toDateKey(p.createdAt) === dateKey
  );
  const totalPrice = purchases.reduce((s, p) => s + Number(p.grandTotal || 0), 0);
  const savedBalance = DB.getPartyBalance(party.id, dateKey);
  const displayBalance = savedBalance !== undefined ? savedBalance : totalPrice;

  container.innerHTML = `
    <!-- BILLS ON THIS DATE -->
    <div class="font-bold text-sm text-muted" style="padding:12px 12px 8px;text-transform:uppercase;letter-spacing:.5px;">Bills on ${fmtDateKey(dateKey)}</div>
    <div style="padding:0 12px;">
      ${purchases.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No bills on this date</div></div>`
        : purchases.map(b => `
          <div class="list-item" onclick="pushPage('purchase-detail',{id:'${b.id}'})">
            <div class="list-avatar" style="background:var(--amber-bg);">📦</div>
            <div class="list-info">
              <div class="list-title">${esc(b.id)}</div>
              <div class="list-sub">${b.items?.length||0} items · ${esc(b.paymentMethod||'Cash')}</div>
            </div>
            <div class="list-right">
              <div class="list-amount text-amber">${fmtCurrency(b.grandTotal)}</div>
              <div style="display:flex;gap:4px;margin-top:4px;">
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();printSingleBill('${b.id}','purchase')" style="padding:4px 8px;">🖨</button>
                <button class="btn btn-blue btn-sm" onclick="event.stopPropagation();shareBill(buildShareText(DB.getPurchaseById('${b.id}'),'purchase'))" style="padding:4px 8px;">📤</button>
              </div>
            </div>
          </div>`).join('')
      }
    </div>

    <!-- TOTAL & EDITABLE BALANCE -->
    <div style="padding:12px;">
      <div class="summary-box">
        <div class="summary-row total">
          <span>Total Price (${fmtDateKey(dateKey)})</span>
          <span>${fmtCurrency(totalPrice)}</span>
        </div>
      </div>

      <!-- EDITABLE BALANCE -->
      <div style="margin-top:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">
          ✏️ Total Balance (Editable)
        </div>
        <div class="balance-edit">
          <span style="color:var(--amber);font-weight:700;font-size:16px;">₹</span>
          <input type="number" id="balance-input" value="${displayBalance}"
            placeholder="Enter balance amount" step="0.01" min="0"
            style="flex:1;" />
          <button class="btn btn-amber btn-sm" onclick="_savePartyBalance('${party.id}','${dateKey}')">Save</button>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:6px;">
          * Edit balance if there is advance payment, discount, or manual adjustment
        </div>
      </div>
    </div>`;
}

function _savePartyBalance(partyId, date) {
  const val = document.getElementById('balance-input')?.value;
  if (val === '' || isNaN(val)) { showToast('⚠️ Enter valid amount'); return; }
  DB.setPartyBalance(partyId, date, Number(val));
  showToast('✅ Balance updated!');
}
