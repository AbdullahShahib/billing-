// ═══════════════════════════════════════════════════
//  VegiBill TN — pages/add-purchase.js
// ═══════════════════════════════════════════════════

let _purItems = [];
let _editPurId = null;

function renderAddPurchase(container, params = {}) {
  _editPurId = params.editId || null;
  const existing = _editPurId ? DB.getPurchaseById(_editPurId) : null;
  _purItems = existing ? JSON.parse(JSON.stringify(existing.items || [])) : [_blankPurItem()];

  setHeaderTitle(_editPurId ? 'Edit Purchase' : 'New Purchase', 'Purchase Entry');

  const parties = DB.getParties();
  const partyOpts = `<option value="">-- Select Supplier --</option>` +
    parties.map(p => `<option value="${esc(p.id)}" data-name="${esc(p.name)}" ${existing?.partyId===p.id?'selected':''}>${esc(p.name)}</option>`).join('');

  container.innerHTML = `
    <div class="page">

      <!-- PURCHASE INFO -->
      <div class="card">
        <div class="form-group">
          <label class="form-label">Purchase Date</label>
          <input type="date" id="pur-date" value="${existing ? toDateKey(existing.createdAt) : todayISO()}" />
        </div>
        <div class="form-group">
          <label class="form-label">Supplier / Party</label>
          <select id="pur-party" onchange="_onPurPartyChange(this)">
            ${partyOpts}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Supplier Name</label>
            <input type="text" id="pur-party-name" placeholder="Name" value="${existing ? esc(existing.partyName||'') : ''}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Mobile</label>
            <input type="tel" id="pur-mobile" placeholder="Mobile" maxlength="10" value="${existing ? esc(existing.mobile||'') : ''}" />
          </div>
        </div>
      </div>

      <!-- ITEMS -->
      <div class="font-bold text-sm text-muted" style="margin:10px 0 8px;text-transform:uppercase;letter-spacing:.5px;">Purchase Items</div>
      <div id="pur-items-container"></div>
      <button class="btn btn-secondary btn-full" style="margin-bottom:12px;" onclick="addPurItem()">+ Add Item</button>

      <!-- SUNGAM -->
      <div class="sungam-row">
        <span class="sungam-label">⚖️ Sungam (Market Levy)</span>
        <input class="sungam-input" type="number" id="pur-sungam" placeholder="0.00" min="0" step="0.01"
          value="${existing ? (existing.sungam||0) : ''}" oninput="recalcPur()" />
      </div>

      <!-- PAYMENT -->
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <div class="pay-chips" id="pur-pay-chips">
          ${['Cash','UPI','Credit','Cheque'].map(m => `
            <button class="pay-chip ${(existing?.paymentMethod||'Cash')===m?'selected':''}"
              onclick="selectPayMethod(this,'${m}','pur')">${m}</button>`).join('')}
        </div>
      </div>
      <input type="hidden" id="pur-payment-method" value="${existing?.paymentMethod||'Cash'}" />

      <!-- SUMMARY -->
      <div class="summary-box">
        <div class="summary-row"><span>Sub Total</span><span id="pur-subtotal">₹0.00</span></div>
        <div class="summary-row"><span>Sungam</span><span id="pur-sungam-display">₹0.00</span></div>
        <div class="summary-row total"><span>Grand Total</span><span id="pur-grandtotal">₹0.00</span></div>
        <div class="form-group" style="margin-top:12px;margin-bottom:0;">
          <label class="form-label">Amount Paid (₹)</label>
          <input type="number" id="pur-paid" placeholder="Enter amount paid" min="0"
            value="${existing ? (existing.amountPaid||'') : ''}" oninput="recalcPur()" />
        </div>
        <div class="summary-row balance" id="pur-balance-row" style="display:none;">
          <span id="pur-balance-label">Balance</span>
          <span id="pur-balance-amt"></span>
        </div>
      </div>

      <!-- SAVE -->
      <div style="display:flex;gap:10px;margin-top:14px;padding-bottom:20px;">
        <button class="btn btn-secondary flex-1" onclick="goBack()">Cancel</button>
        <button class="btn btn-amber flex-1 btn-lg" onclick="savePurchaseBill()">
          💾 ${_editPurId ? 'Update' : 'Save Purchase'}
        </button>
      </div>
    </div>`;

  renderPurItemsTable();
  recalcPur();
}

function _blankPurItem() {
  return { itemName: '', bags: '', quantity: '', unit: 'kg', pricePerUnit: '', totalPrice: '' };
}

function _onPurPartyChange(sel) {
  const opt = sel.options[sel.selectedIndex];
  const name = opt?.dataset?.name || '';
  document.getElementById('pur-party-name').value = name;
}

function renderPurItemsTable() {
  const container = document.getElementById('pur-items-container');
  if (!container) return;

  const rows = _purItems.map((item, i) => `
    <div style="display:grid;grid-template-columns:1.8fr .7fr .7fr .7fr .8fr 30px;gap:5px;padding:8px 10px;border-bottom:1px solid var(--border);background:var(--bg2);align-items:center;">
      <input type="text" placeholder="Item name / பொருள்" value="${esc(item.itemName)}"
        oninput="_purItems[${i}].itemName=this.value" style="font-size:13px;" />
      <input type="text" placeholder="Bags" value="${esc(item.bags)}"
        oninput="_purItems[${i}].bags=this.value" style="font-size:13px;" />
      <input type="number" placeholder="Qty" value="${esc(item.quantity)}" min="0" step="0.01"
        oninput="_purItems[${i}].quantity=this.value;calcPurRowTotal(${i})" style="font-size:13px;" />
      <div style="display:flex;flex-direction:column;gap:3px;">
        <select onchange="_purItems[${i}].unit=this.value" style="font-size:11px;padding:4px 6px;">
          ${['kg','g','pc','bunch','bag','dozen','quintal'].map(u => `<option ${item.unit===u?'selected':''}>${u}</option>`).join('')}
        </select>
        <input type="number" placeholder="₹/unit" value="${esc(item.pricePerUnit)}" min="0" step="0.01"
          oninput="_purItems[${i}].pricePerUnit=this.value;calcPurRowTotal(${i})" style="font-size:12px;" />
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:var(--text3);">Total</div>
        <div style="font-size:14px;font-weight:700;color:var(--amber);" id="pur-row-total-${i}">
          ₹${fmtNum(item.totalPrice)}
        </div>
      </div>
      <button class="del-btn" onclick="removePurItem(${i})">✕</button>
    </div>`).join('');

  container.innerHTML = `
    <div style="background:var(--bg3);border-radius:var(--radius-sm) var(--radius-sm) 0 0;padding:7px 10px;display:grid;grid-template-columns:1.8fr .7fr .7fr .7fr .8fr 30px;gap:5px;">
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Item</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Bags</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Qty</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Unit/Rate</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);text-align:right;">Price</span>
      <span></span>
    </div>
    <div style="border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-sm) var(--radius-sm);overflow:hidden;margin-bottom:10px;">
      ${rows}
    </div>`;
  recalcPur();
}

function calcPurRowTotal(i) {
  const qty = Number(_purItems[i].quantity) || 0;
  const price = Number(_purItems[i].pricePerUnit) || 0;
  _purItems[i].totalPrice = (qty * price).toFixed(2);
  const el = document.getElementById('pur-row-total-' + i);
  if (el) el.textContent = '₹' + fmtNum(_purItems[i].totalPrice);
  recalcPur();
}

function recalcPur() {
  const sub = _purItems.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const sungam = Number(document.getElementById('pur-sungam')?.value || 0);
  const grand = sub + sungam;
  const paid = Number(document.getElementById('pur-paid')?.value || 0);

  const el = id => document.getElementById(id);
  if (el('pur-subtotal')) el('pur-subtotal').textContent = fmtCurrency(sub);
  if (el('pur-sungam-display')) el('pur-sungam-display').textContent = fmtCurrency(sungam);
  if (el('pur-grandtotal')) el('pur-grandtotal').textContent = fmtCurrency(grand);

  const balRow = el('pur-balance-row');
  if (balRow && paid > 0) {
    const bal = paid - grand;
    balRow.style.display = 'flex';
    el('pur-balance-label').textContent = bal >= 0 ? 'Balance Return' : 'Balance Due';
    el('pur-balance-amt').textContent = fmtCurrency(Math.abs(bal));
    el('pur-balance-amt').style.color = bal >= 0 ? 'var(--green)' : 'var(--red)';
  } else if (balRow) { balRow.style.display = 'none'; }
}

function addPurItem() {
  _purItems.push(_blankPurItem());
  renderPurItemsTable();
}
function removePurItem(i) {
  _purItems.splice(i, 1);
  if (_purItems.length === 0) _purItems.push(_blankPurItem());
  renderPurItemsTable();
}

function savePurchaseBill() {
  const validItems = _purItems.filter(i => i.itemName && Number(i.totalPrice) > 0);
  if (validItems.length === 0) { showToast('⚠️ Add at least one item!'); return; }

  const dateVal = document.getElementById('pur-date').value;
  const sub = validItems.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const sungam = Number(document.getElementById('pur-sungam').value || 0);
  const grand = sub + sungam;
  const paid = Number(document.getElementById('pur-paid').value || grand);
  const partyEl = document.getElementById('pur-party');
  const partyId = partyEl.value;

  const purchase = {
    id: _editPurId || undefined,
    createdAt: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
    partyId,
    partyName: document.getElementById('pur-party-name').value.trim(),
    mobile: document.getElementById('pur-mobile').value.trim(),
    items: validItems,
    subTotal: sub.toFixed(2),
    sungam: sungam.toFixed(2),
    grandTotal: grand.toFixed(2),
    amountPaid: paid.toFixed(2),
    paymentMethod: document.getElementById('pur-payment-method').value,
  };

  const saved = DB.savePurchase(purchase);
  showToast('✅ Purchase saved! ' + saved.id);
  _purItems = [_blankPurItem()];
  _editPurId = null;
  pushPage('purchase-detail', { id: saved.id });
}
