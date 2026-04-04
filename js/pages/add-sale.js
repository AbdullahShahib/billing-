// ═══════════════════════════════════════════════════
//  VegiBill TN — pages/add-sale.js
// ═══════════════════════════════════════════════════

let _saleItems = [];
let _editSaleId = null;

function renderAddSale(container, params = {}) {
  _editSaleId = params.editId || null;
  let existing = _editSaleId ? DB.getSaleById(_editSaleId) : null;
  _saleItems = existing ? JSON.parse(JSON.stringify(existing.items || [])) : [_blankSaleItem()];

  setHeaderTitle(_editSaleId ? 'Edit Sale' : 'New Sale', 'Sale Bill');

  const parties = DB.getParties();
  const partyOpts = parties.map(p => `<option value="${esc(p.id)}" ${existing?.partyId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

  container.innerHTML = `
    <div class="page" id="add-sale-page">

      <!-- BILL INFO -->
      <div class="card">
        <div class="form-group">
          <label class="form-label">Sale Date</label>
          <input type="date" id="sale-date" value="${existing ? toDateKey(existing.createdAt) : todayISO()}" />
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Customer Name</label>
            <input type="text" id="sale-customer" placeholder="Optional" value="${existing ? esc(existing.partyName||'') : ''}" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Mobile</label>
            <input type="tel" id="sale-mobile" placeholder="10 digits" maxlength="10" value="${existing ? esc(existing.mobile||'') : ''}" />
          </div>
        </div>
      </div>

      <!-- ITEMS -->
      <div class="font-bold text-sm text-muted" style="margin:10px 0 8px;text-transform:uppercase;letter-spacing:.5px;">Bill Items</div>
      <div id="sale-items-container"></div>
      <button class="btn btn-secondary btn-full" style="margin-bottom:12px;" onclick="addSaleItem()">+ Add Item</button>

      <!-- SUNGAM (Market Levy/Tax) -->
      <div class="sungam-row">
        <span class="sungam-label">⚖️ Sungam (Market Levy)</span>
        <input class="sungam-input" type="number" id="sale-sungam" placeholder="0.00" min="0" step="0.01"
          value="${existing ? (existing.sungam||0) : ''}" oninput="recalcSale()" />
      </div>

      <!-- PAYMENT METHOD -->
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <div class="pay-chips" id="sale-pay-chips">
          ${['Cash','UPI','Credit','Cheque'].map(m => `
            <button class="pay-chip ${(existing?.paymentMethod||'Cash')===m?'selected':''}"
              onclick="selectPayMethod(this,'${m}','sale')">${m}</button>`).join('')}
        </div>
      </div>
      <input type="hidden" id="sale-payment-method" value="${existing?.paymentMethod||'Cash'}" />

      <!-- SUMMARY -->
      <div class="summary-box">
        <div class="summary-row"><span>Sub Total</span><span id="sale-subtotal">₹0.00</span></div>
        <div class="summary-row"><span>Sungam</span><span id="sale-sungam-display">₹0.00</span></div>
        <div class="summary-row total"><span>Grand Total</span><span id="sale-grandtotal">₹0.00</span></div>
        <div class="form-group" style="margin-top:12px;margin-bottom:0;">
          <label class="form-label">Amount Paid (₹)</label>
          <input type="number" id="sale-paid" placeholder="Enter amount paid" min="0"
            value="${existing ? (existing.amountPaid||'') : ''}" oninput="recalcSale()" />
        </div>
        <div class="summary-row balance" id="sale-balance-row" style="display:none;">
          <span id="sale-balance-label">Balance</span>
          <span id="sale-balance-amt"></span>
        </div>
      </div>

      <!-- SAVE -->
      <div style="display:flex;gap:10px;margin-top:14px;padding-bottom:20px;">
        <button class="btn btn-secondary flex-1" onclick="goBack()">Cancel</button>
        <button class="btn btn-primary flex-1 btn-lg" onclick="saveSaleBill()">
          💾 ${_editSaleId ? 'Update Bill' : 'Save Bill'}
        </button>
      </div>
    </div>`;

  renderSaleItemsTable();
  recalcSale();
}

function _blankSaleItem() {
  return { itemName: '', bags: '', quantity: '', unit: 'kg', pricePerUnit: '', totalPrice: '' };
}

function renderSaleItemsTable() {
  const container = document.getElementById('sale-items-container');
  if (!container) return;
  if (_saleItems.length === 0) { container.innerHTML = ''; return; }

  const rows = _saleItems.map((item, i) => `
    <div class="bill-item-row" style="display:grid;grid-template-columns:1.8fr .7fr .7fr .7fr .8fr 30px;gap:5px;padding:8px 10px;border-bottom:1px solid var(--border);background:var(--bg2);align-items:center;">
      <input type="text" placeholder="Item name / பொருள்" value="${esc(item.itemName)}"
        oninput="_saleItems[${i}].itemName=this.value" style="font-size:13px;" />
      <input type="text" placeholder="Bags" value="${esc(item.bags)}"
        oninput="_saleItems[${i}].bags=this.value" style="font-size:13px;" />
      <input type="number" placeholder="Qty" value="${esc(item.quantity)}" min="0" step="0.01"
        oninput="_saleItems[${i}].quantity=this.value;calcRowTotal(${i})" style="font-size:13px;" />
      <div style="display:flex;flex-direction:column;gap:3px;">
        <select onchange="_saleItems[${i}].unit=this.value" style="font-size:11px;padding:4px 6px;">
          ${['kg','g','pc','bunch','bag','dozen','quintal'].map(u => `<option ${item.unit===u?'selected':''}>${u}</option>`).join('')}
        </select>
        <input type="number" placeholder="₹/unit" value="${esc(item.pricePerUnit)}" min="0" step="0.01"
          oninput="_saleItems[${i}].pricePerUnit=this.value;calcRowTotal(${i})" style="font-size:12px;" />
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:var(--text3);">Total</div>
        <div style="font-size:14px;font-weight:700;color:var(--green);" id="sale-row-total-${i}">
          ₹${fmtNum(item.totalPrice)}
        </div>
      </div>
      <button class="del-btn" onclick="removeSaleItem(${i})">✕</button>
    </div>`).join('');

  container.innerHTML = `
    <div style="background:var(--bg3);border-radius:var(--radius-sm) var(--radius-sm) 0 0;padding:7px 10px;display:grid;grid-template-columns:1.8fr .7fr .7fr .7fr .8fr 30px;gap:5px;">
      <span style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;">Item / பொருள்</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Bags</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Qty</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);">Unit/Rate</span>
      <span style="font-size:10px;font-weight:700;color:var(--text3);text-align:right;">Price</span>
      <span></span>
    </div>
    <div style="border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius-sm) var(--radius-sm);overflow:hidden;margin-bottom:10px;">
      ${rows}
    </div>`;
  recalcSale();
}

function calcRowTotal(i) {
  const qty = Number(_saleItems[i].quantity) || 0;
  const price = Number(_saleItems[i].pricePerUnit) || 0;
  _saleItems[i].totalPrice = (qty * price).toFixed(2);
  const el = document.getElementById('sale-row-total-' + i);
  if (el) el.textContent = '₹' + fmtNum(_saleItems[i].totalPrice);
  recalcSale();
}

function recalcSale() {
  const sub = _saleItems.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const sungam = Number(document.getElementById('sale-sungam')?.value || 0);
  const grand = sub + sungam;
  const paid = Number(document.getElementById('sale-paid')?.value || 0);

  const el = id => document.getElementById(id);
  if (el('sale-subtotal')) el('sale-subtotal').textContent = fmtCurrency(sub);
  if (el('sale-sungam-display')) el('sale-sungam-display').textContent = fmtCurrency(sungam);
  if (el('sale-grandtotal')) el('sale-grandtotal').textContent = fmtCurrency(grand);

  const balRow = el('sale-balance-row');
  if (balRow && paid > 0) {
    const bal = paid - grand;
    balRow.style.display = 'flex';
    el('sale-balance-label').textContent = bal >= 0 ? 'Balance Return' : 'Balance Due';
    el('sale-balance-amt').textContent = fmtCurrency(Math.abs(bal));
    el('sale-balance-amt').style.color = bal >= 0 ? 'var(--green)' : 'var(--red)';
  } else if (balRow) {
    balRow.style.display = 'none';
  }
}

function addSaleItem() {
  _saleItems.push(_blankSaleItem());
  renderSaleItemsTable();
}

function removeSaleItem(i) {
  _saleItems.splice(i, 1);
  if (_saleItems.length === 0) _saleItems.push(_blankSaleItem());
  renderSaleItemsTable();
}

function selectPayMethod(btn, method, type) {
  const chips = btn.parentElement.querySelectorAll('.pay-chip');
  chips.forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');
  const hiddenInput = document.getElementById(type === 'sale' ? 'sale-payment-method' : 'pur-payment-method');
  if (hiddenInput) hiddenInput.value = method;
}

function saveSaleBill() {
  const validItems = _saleItems.filter(i => i.itemName && Number(i.totalPrice) > 0);
  if (validItems.length === 0) { showToast('⚠️ Add at least one item with price!'); return; }

  const dateVal = document.getElementById('sale-date').value;
  const sub = validItems.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const sungam = Number(document.getElementById('sale-sungam').value || 0);
  const grand = sub + sungam;
  const paid = Number(document.getElementById('sale-paid').value || grand);

  const bill = {
    id: _editSaleId || undefined,
    createdAt: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
    partyName: document.getElementById('sale-customer').value.trim(),
    mobile: document.getElementById('sale-mobile').value.trim(),
    items: validItems,
    subTotal: sub.toFixed(2),
    sungam: sungam.toFixed(2),
    grandTotal: grand.toFixed(2),
    amountPaid: paid.toFixed(2),
    paymentMethod: document.getElementById('sale-payment-method').value,
  };

  const saved = DB.saveSale(bill);
  showToast('✅ Bill saved! ' + saved.id);

  // Reset
  _saleItems = [_blankSaleItem()];
  _editSaleId = null;
  pushPage('sale-detail', { id: saved.id });
}
