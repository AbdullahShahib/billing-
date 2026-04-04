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
      <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Purchase Date</label>
          <input type="date" id="pur-date" value="${existing ? toDateKey(existing.createdAt) : todayISO()}" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Supplier</label>
          <select id="pur-party" onchange="_onPurPartyChange(this)">
            ${partyOpts}
          </select>
        </div>
      </div>

      <!-- ITEMS - SPREADSHEET VIEW -->
      <div class="pur-items-wrapper">
        <div id="pur-items-container"></div>
      </div>

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
        <button class="btn btn-amber flex-1" onclick="savePurchaseBill()">
          💾 ${_editPurId ? 'Update' : 'Save'}
        </button>
        <button class="btn btn-amber flex-1 btn-lg" onclick="savePurchaseBillAndPrint()">
          🖨️ ${_editPurId ? 'Update & Print' : 'Save & Print'}
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
  document.getElementById('pur-party').dataset.partyName = name;
}

function renderPurItemsTable() {
  const container = document.getElementById('pur-items-container');
  if (!container) return;

  const isMobile = window.innerWidth < 480;
  
  // Desktop view: grid layout
  if (!isMobile) {
    const rows = _purItems.map((item, i) => `
      <div class="pur-table-row" data-index="${i}">
        <input type="text" class="pur-item-name" placeholder="Item name" value="${esc(item.itemName)}"
          data-index="${i}" oninput="_purItems[${i}].itemName=this.value" onkeydown="_onPurKeydown(event, ${i}, 'name')" />
        <input type="text" class="pur-item-bags" placeholder="Bags" value="${esc(item.bags)}"
          data-index="${i}" oninput="_purItems[${i}].bags=this.value" onkeydown="_onPurKeydown(event, ${i}, 'bags')" />
        <input type="number" class="pur-item-qty" placeholder="Qty" value="${esc(item.quantity)}" min="0" step="0.01"
          data-index="${i}" onkeydown="_onPurKeydown(event, ${i}, 'qty')" oninput="_purItems[${i}].quantity=this.value;calcPurRowTotal(${i})" />
        <select class="pur-item-unit" data-index="${i}" onchange="_purItems[${i}].unit=this.value;calcPurRowTotal(${i})">
          ${['kg','g','pc','bunch','bag','dozen','quintal'].map(u => `<option ${item.unit===u?'selected':''}>${u}</option>`).join('')}
        </select>
        <input type="number" class="pur-item-price" placeholder="₹/unit" value="${esc(item.pricePerUnit)}" min="0" step="0.01"
          data-index="${i}" onkeydown="_onPurKeydown(event, ${i}, 'price')" oninput="_purItems[${i}].pricePerUnit=this.value;calcPurRowTotal(${i})" />
        <div class="pur-item-total" id="pur-row-total-${i}">₹${fmtNum(item.totalPrice)}</div>
        <button class="pur-item-del" onclick="removePurItem(${i})">✕</button>
      </div>`).join('');

    container.innerHTML = `
      <div class="pur-table-header">
        <div>Item</div>
        <div>Bags</div>
        <div>Qty</div>
        <div>Unit</div>
        <div>Rate (₹)</div>
        <div>Total</div>
        <div></div>
      </div>
      <div class="pur-table-body">${rows}</div>`;
  } else {
    // Mobile view: card layout
    const cards = _purItems.map((item, i) => `
      <div class="pur-card" data-index="${i}">
        <div class="pur-card-row">
          <label>Item</label>
          <input type="text" class="pur-item-name" placeholder="Item name" value="${esc(item.itemName)}"
            data-index="${i}" oninput="_purItems[${i}].itemName=this.value" onkeydown="_onPurKeydown(event, ${i}, 'name')" />
        </div>
        <div class="pur-card-row">
          <label>Bags</label>
          <input type="text" class="pur-item-bags" placeholder="Bags" value="${esc(item.bags)}"
            data-index="${i}" oninput="_purItems[${i}].bags=this.value" onkeydown="_onPurKeydown(event, ${i}, 'bags')" />
        </div>
        <div class="pur-card-row">
          <label>Qty × Unit</label>
          <div style="display:flex;gap:5px;">
            <input type="number" class="pur-item-qty" placeholder="Qty" value="${esc(item.quantity)}" min="0" step="0.01" style="flex:1;"
              data-index="${i}" onkeydown="_onPurKeydown(event, ${i}, 'qty')" oninput="_purItems[${i}].quantity=this.value;calcPurRowTotal(${i})" />
            <select class="pur-item-unit" style="flex:0.8;" onchange="_purItems[${i}].unit=this.value;calcPurRowTotal(${i})">
              ${['kg','g','pc','bunch','bag','dozen','quintal'].map(u => `<option ${item.unit===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="pur-card-row">
          <label>Rate (₹)</label>
          <input type="number" class="pur-item-price" placeholder="Price/unit" value="${esc(item.pricePerUnit)}" min="0" step="0.01"
            data-index="${i}" onkeydown="_onPurKeydown(event, ${i}, 'price')" oninput="_purItems[${i}].pricePerUnit=this.value;calcPurRowTotal(${i})" />
        </div>
        <div class="pur-card-summary">
          <span>Total</span>
          <span style="font-weight:bold;color:var(--amber);" id="pur-row-total-${i}">₹${fmtNum(item.totalPrice)}</span>
          <button class="pur-item-del" onclick="removePurItem(${i})" style="margin-left:auto;">✕</button>
        </div>
      </div>`).join('');

    container.innerHTML = `<div class="pur-cards-wrapper">${cards}</div>`;
  }
function _onPurKeydown(e, i, field) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  
  const item = _purItems[i];
  const isLastItem = i === _purItems.length - 1;
  const hasData = item.itemName && item.quantity && item.pricePerUnit;
  
  if (isLastItem && hasData) {
    // Add new blank item when Enter pressed on last row with data
    _purItems.push(_blankPurItem());
    renderPurItemsTable();
    // Focus the new row's item name field
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-index="${_purItems.length - 1}"].pur-item-name`);
      if (newInput) newInput.focus();
    }, 100);
  } else {
    // Move to next field
    const fields = ['name', 'bags', 'qty', 'unit', 'price'];
  const partyName = partyEl.options[partyEl.selectedIndex]?.text || '';

  return {
    id: _editPurId || undefined,
    createdAt: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
    partyId,
    partyName: partyName === '-- Select Supplier --' ? '' : partyName,
    mobile: ''
      // Last field, move to next row
      if (i + 1 < _purItems.length) {
        const nextInput = document.querySelector(`.pur-item-name[data-index="${i + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  }
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

function _buildPurchaseBill() {
  const validItems = _purItems.filter(i => i.itemName && Number(i.totalPrice) > 0);
  if (validItems.length === 0) return null;

  const dateVal = document.getElementById('pur-date').value;
  const sub = validItems.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const sungam = Number(document.getElementById('pur-sungam').value || 0);
  const grand = sub + sungam;
  const paid = Number(document.getElementById('pur-paid').value || grand);
  const partyEl = document.getElementById('pur-party');
  const partyId = partyEl.value;

  return {
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
}

function savePurchaseBill() {
  const bill = _buildPurchaseBill();
  if (!bill) { showToast('⚠️ Add at least one item!'); return; }

  const saved = DB.savePurchase(bill);
  showToast('✅ Purchase saved! ' + saved.id);
  _purItems = [_blankPurItem()];
  _editPurId = null;
  pushPage('purchase-detail', { id: saved.id });
}

function savePurchaseBillAndPrint() {
  const bill = _buildPurchaseBill();
  if (!bill) { showToast('⚠️ Add at least one item!'); return; }

  const saved = DB.savePurchase(bill);
  showToast('✅ Purchase saved! ' + saved.id);
  _purItems = [_blankPurItem()];
  _editPurId = null;

  // Print immediately
  setTimeout(() => {
    printSingleBill(saved.id, 'purchase');
  }, 300);

  // Navigate after a delay to let print dialog open
  setTimeout(() => {
    pushPage('purchase-detail', { id: saved.id });
  }, 500);
}
