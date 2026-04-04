// ═══════════════════════════════════════════════════
//  VegiBill TN — db.js  (Local Storage Database)
//  Replace localStorage calls with Firebase/Supabase
//  by swapping functions below.
// ═══════════════════════════════════════════════════

const DB = (() => {

  // ── GENERIC HELPERS ──────────────────────────────
  function read(key, fallback = []) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('DB write error', e); }
  }

  // ── BILL NUMBER GENERATOR ─────────────────────────
  let _billNum = read('vb_bill_counter', 1000);
  function nextSaleNo() {
    _billNum++;
    write('vb_bill_counter', _billNum);
    return 'SL' + String(_billNum).padStart(5, '0');
  }
  let _purNum = read('vb_pur_counter', 2000);
  function nextPurNo() {
    _purNum++;
    write('vb_pur_counter', _purNum);
    return 'PUR' + String(_purNum).padStart(4, '0');
  }

  // ── SALES ─────────────────────────────────────────
  function getSales() { return read('vb_sales', []); }
  function saveSale(bill) {
    const sales = getSales();
    bill.id = bill.id || nextSaleNo();
    bill.createdAt = bill.createdAt || new Date().toISOString();
    const idx = sales.findIndex(s => s.id === bill.id);
    if (idx >= 0) sales[idx] = bill; else sales.unshift(bill);
    write('vb_sales', sales);
    return bill;
  }
  function deleteSale(id) {
    write('vb_sales', getSales().filter(s => s.id !== id));
  }
  function getSaleById(id) { return getSales().find(s => s.id === id); }

  // ── PURCHASES ─────────────────────────────────────
  function getPurchases() { return read('vb_purchases', []); }
  function savePurchase(p) {
    const purchases = getPurchases();
    p.id = p.id || nextPurNo();
    p.createdAt = p.createdAt || new Date().toISOString();
    const idx = purchases.findIndex(x => x.id === p.id);
    if (idx >= 0) purchases[idx] = p; else purchases.unshift(p);
    write('vb_purchases', purchases);
    return p;
  }
  function deletePurchase(id) {
    write('vb_purchases', getPurchases().filter(p => p.id !== id));
  }
  function getPurchaseById(id) { return getPurchases().find(p => p.id === id); }

  // ── PARTIES ───────────────────────────────────────
  function getParties() { return read('vb_parties', []); }
  function saveParty(party) {
    const parties = getParties();
    party.id = party.id || 'P' + Date.now();
    party.createdAt = party.createdAt || new Date().toISOString();
    const idx = parties.findIndex(p => p.id === party.id);
    if (idx >= 0) parties[idx] = party; else parties.push(party);
    write('vb_parties', parties);
    return party;
  }
  function deleteParty(id) {
    write('vb_parties', getParties().filter(p => p.id !== id));
  }
  function getPartyById(id) { return getParties().find(p => p.id === id); }

  // ── PARTY BALANCE OVERRIDE ────────────────────────
  // balances: { partyId_date: customBalance }
  function getPartyBalances() { return read('vb_party_balances', {}); }
  function setPartyBalance(partyId, date, amount) {
    const b = getPartyBalances();
    b[partyId + '_' + date] = amount;
    write('vb_party_balances', b);
  }
  function getPartyBalance(partyId, date) {
    const b = getPartyBalances();
    return b[partyId + '_' + date];
  }

  // ── SETTINGS ──────────────────────────────────────
  function getSettings() {
    return read('vb_settings', {
      shopName: 'Sri Murugan Vegetables',
      address: 'No. 12, Market Street, Chennai - 600001',
      phone: '9876543210',
      gstin: '33AABCU9603R1ZJ',
      state: 'Tamil Nadu',
      stateCode: '33',
    });
  }
  function saveSettings(s) { write('vb_settings', s); }

  // ── ITEM MASTER ────────────────────────────────────
  const DEFAULT_ITEMS = [
    { id: 'onion',       name: 'Onion',        tamil: 'வெங்காயம்',       price: 35, unit: 'kg',    emoji: '🧅' },
    { id: 'tomato',      name: 'Tomato',       tamil: 'தக்காளி',         price: 28, unit: 'kg',    emoji: '🍅' },
    { id: 'potato',      name: 'Potato',       tamil: 'உருளைக்கிழங்கு', price: 32, unit: 'kg',    emoji: '🥔' },
    { id: 'carrot',      name: 'Carrot',       tamil: 'கேரட்',           price: 45, unit: 'kg',    emoji: '🥕' },
    { id: 'beans',       name: 'Beans',        tamil: 'பீன்ஸ்',           price: 60, unit: 'kg',    emoji: '🫘' },
    { id: 'brinjal',     name: 'Brinjal',      tamil: 'கத்திரிக்காய்',   price: 30, unit: 'kg',    emoji: '🍆' },
    { id: 'capsicum',    name: 'Capsicum',     tamil: 'குடமிளகாய்',      price: 80, unit: 'kg',    emoji: '🫑' },
    { id: 'ladyfinger',  name: 'Lady Finger',  tamil: 'வெண்டைக்காய்',   price: 55, unit: 'kg',    emoji: '🌿' },
    { id: 'bittergourd', name: 'Bitter Gourd', tamil: 'பாகற்காய்',       price: 40, unit: 'kg',    emoji: '🥬' },
    { id: 'drumstick',   name: 'Drumstick',    tamil: 'முருங்கைக்காய்',  price: 25, unit: 'bunch', emoji: '🌿' },
    { id: 'coconut',     name: 'Coconut',      tamil: 'தேங்காய்',        price: 30, unit: 'pc',    emoji: '🥥' },
    { id: 'lemon',       name: 'Lemon',        tamil: 'எலுமிச்சை',       price: 5,  unit: 'pc',    emoji: '🍋' },
    { id: 'spinach',     name: 'Spinach',      tamil: 'கீரை',            price: 15, unit: 'bunch', emoji: '🥬' },
    { id: 'cucumber',    name: 'Cucumber',     tamil: 'வெள்ளரி',         price: 25, unit: 'kg',    emoji: '🥒' },
    { id: 'pumpkin',     name: 'Pumpkin',      tamil: 'பூசணிக்காய்',    price: 20, unit: 'kg',    emoji: '🎃' },
    { id: 'cabbage',     name: 'Cabbage',      tamil: 'முட்டைக்கோஸ்',   price: 22, unit: 'kg',    emoji: '🥬' },
    { id: 'cauliflower', name: 'Cauliflower',  tamil: 'காலிஃப்ளவர்',    price: 36, unit: 'kg',    emoji: '🥦' },
    { id: 'beetroot',    name: 'Beetroot',     tamil: 'பீட்ரூட்',        price: 34, unit: 'kg',    emoji: '🫜' },
    { id: 'radish',      name: 'Radish',       tamil: 'முள்ளங்கி',       price: 24, unit: 'kg',    emoji: '🥬' },
    { id: 'turnip',      name: 'Turnip',       tamil: 'டர்னிப்',         price: 30, unit: 'kg',    emoji: '🥬' },
    { id: 'broadbeans',  name: 'Broad Beans',  tamil: 'அவரைக்காய்',      price: 52, unit: 'kg',    emoji: '🫘' },
    { id: 'clusterbeans',name: 'Cluster Beans',tamil: 'கொத்தவரங்காய்',  price: 48, unit: 'kg',    emoji: '🫘' },
    { id: 'greanpeas',   name: 'Green Peas',   tamil: 'பட்டாணி',         price: 70, unit: 'kg',    emoji: '🫛' },
    { id: 'rawbanana',   name: 'Raw Banana',   tamil: 'வாழைக்காய்',      price: 26, unit: 'kg',    emoji: '🍌' },
    { id: 'bananaflower',name: 'Banana Flower',tamil: 'வாழைப்பூ',        price: 20, unit: 'pc',    emoji: '🌸' },
    { id: 'bananastem',  name: 'Banana Stem',  tamil: 'வாழைத்தண்டு',     price: 18, unit: 'pc',    emoji: '🌿' },
    { id: 'ashgourd',    name: 'Ash Gourd',    tamil: 'வெள்ளைப்பூசணி',  price: 18, unit: 'kg',    emoji: '🎃' },
    { id: 'bottlegourd', name: 'Bottle Gourd', tamil: 'சுரைக்காய்',       price: 22, unit: 'kg',    emoji: '🥬' },
    { id: 'ridgegourd',  name: 'Ridge Gourd',  tamil: 'பீர்க்கங்காய்',    price: 30, unit: 'kg',    emoji: '🥬' },
    { id: 'snakegourd',  name: 'Snake Gourd',  tamil: 'புடலங்காய்',      price: 28, unit: 'kg',    emoji: '🥬' },
    { id: 'ivyguard',    name: 'Ivy Gourd',    tamil: 'கோவைக்காய்',      price: 34, unit: 'kg',    emoji: '🥒' },
    { id: 'chayote',     name: 'Chayote',      tamil: 'சௌ சௌ',          price: 24, unit: 'kg',    emoji: '🥬' },
    { id: 'yam',         name: 'Yam',          tamil: 'சேனைக்கிழங்கு',   price: 42, unit: 'kg',    emoji: '🥔' },
    { id: 'colocasia',   name: 'Colocasia',    tamil: 'சேப்பங்கிழங்கு',  price: 40, unit: 'kg',    emoji: '🥔' },
    { id: 'sweetpotato', name: 'Sweet Potato', tamil: 'சர்க்கரைவள்ளிக்கிழங்கு', price: 38, unit: 'kg', emoji: '🍠' },
    { id: 'ginger',      name: 'Ginger',       tamil: 'இஞ்சி',          price: 110,unit: 'kg',    emoji: '🫚' },
    { id: 'garlic',      name: 'Garlic',       tamil: 'பூண்டு',          price: 160,unit: 'kg',    emoji: '🧄' },
    { id: 'chilli',      name: 'Green Chilli', tamil: 'பச்சை மிளகாய்',    price: 72, unit: 'kg',    emoji: '🌶️' },
    { id: 'redchilli',   name: 'Red Chilli',   tamil: 'சிவப்பு மிளகாய்',   price: 180,unit: 'kg',    emoji: '🌶️' },
    { id: 'coriander',   name: 'Coriander',    tamil: 'கொத்தமல்லி',      price: 12, unit: 'bunch', emoji: '🌿' },
    { id: 'mint',        name: 'Mint',         tamil: 'புதினா',          price: 10, unit: 'bunch', emoji: '🌿' },
    { id: 'curryleaf',   name: 'Curry Leaf',   tamil: 'கருவேப்பிலை',      price: 10, unit: 'bunch', emoji: '🌿' },
    { id: 'springonion', name: 'Spring Onion', tamil: 'வெங்காயத்தாள்',    price: 20, unit: 'bunch', emoji: '🌿' },
    { id: 'mushroom',    name: 'Mushroom',     tamil: 'காளான்',          price: 160,unit: 'kg',    emoji: '🍄' },
    { id: 'knolkhol',    name: 'Knol Khol',    tamil: 'நூல்கோல்',        price: 32, unit: 'kg',    emoji: '🥬' },
    { id: 'zucchini',    name: 'Zucchini',     tamil: 'சுக்கினி',         price: 90, unit: 'kg',    emoji: '🥒' },
    { id: 'broccoli',    name: 'Broccoli',     tamil: 'ப்ரோகோலி',        price: 120,unit: 'kg',    emoji: '🥦' },
    { id: 'lettuce',     name: 'Lettuce',      tamil: 'லெட்டூஸ்',        price: 70, unit: 'kg',    emoji: '🥬' },
    { id: 'celery',      name: 'Celery',       tamil: 'செலரி',          price: 95, unit: 'kg',    emoji: '🌿' },
    { id: 'parsley',     name: 'Parsley',      tamil: 'பார்ஸ்லி',        price: 110,unit: 'kg',    emoji: '🌿' },
    { id: 'maize',       name: 'Sweet Corn',   tamil: 'சோளம்',           price: 35, unit: 'pc',    emoji: '🌽' },
    { id: 'peasfrozen',  name: 'Fresh Peas',   tamil: 'பச்சை பட்டாணி',    price: 80, unit: 'kg',    emoji: '🫛' },
    { id: 'plantain',    name: 'Plantain',     tamil: 'பிளாண்டெயின்',     price: 28, unit: 'kg',    emoji: '🍌' },
    { id: 'rawpapaya',   name: 'Raw Papaya',   tamil: 'பப்பாளிக்காய்',    price: 24, unit: 'kg',    emoji: '🥬' },
    { id: 'shallot',     name: 'Shallot',      tamil: 'சின்ன வெங்காயம்',  price: 48, unit: 'kg',    emoji: '🧅' },
    { id: 'sambaronion', name: 'Sambar Onion', tamil: 'சாம்பார் வெங்காயம்', price: 50, unit: 'kg', emoji: '🧅' },
    { id: 'turmeric',    name: 'Fresh Turmeric', tamil: 'மஞ்சள் கிழங்கு', price: 90, unit: 'kg',   emoji: '🫚' },
    { id: 'rawmango',    name: 'Raw Mango',    tamil: 'மாங்காய்',         price: 40, unit: 'kg',    emoji: '🥭' },
    { id: 'avarai',      name: 'Avarai',       tamil: 'அவரை',            price: 44, unit: 'kg',    emoji: '🫘' },
    { id: 'karamani',    name: 'Cowpea',       tamil: 'கராமணி',          price: 60, unit: 'kg',    emoji: '🫘' },
    { id: 'sundakkai',   name: 'Turkey Berry', tamil: 'சுண்டைக்காய்',      price: 55, unit: 'kg',    emoji: '🥬' },
    { id: 'agathi',      name: 'Agathi Keerai', tamil: 'அகத்தி கீரை',     price: 14, unit: 'bunch', emoji: '🌿' },
    { id: 'murungaikeerai', name: 'Drumstick Leaves', tamil: 'முருங்கைக்கீரை', price: 16, unit: 'bunch', emoji: '🌿' },
    { id: 'ponnanganni', name: 'Ponnanganni Keerai', tamil: 'பொன்னாங்கண்ணி கீரை', price: 14, unit: 'bunch', emoji: '🌿' },
    { id: 'manathakkali', name: 'Manathakkali Keerai', tamil: 'மணத்தக்காளி கீரை', price: 14, unit: 'bunch', emoji: '🌿' },
    { id: 'arai',        name: 'Arai Keerai',  tamil: 'அரைக்கீரை',        price: 12, unit: 'bunch', emoji: '🌿' },
    { id: 'siru',        name: 'Siru Keerai',  tamil: 'சிறுகீரை',         price: 12, unit: 'bunch', emoji: '🌿' },
  ];
  function getItems() {
    const saved = read('vb_items', null);
    if (!Array.isArray(saved) || saved.length === 0) {
      write('vb_items', DEFAULT_ITEMS);
      return [...DEFAULT_ITEMS];
    }

    // Keep user prices/edits and auto-append any newly introduced defaults.
    const merged = [...saved];
    DEFAULT_ITEMS.forEach(def => {
      if (!merged.some(x => x.id === def.id)) merged.push(def);
    });

    if (merged.length !== saved.length) write('vb_items', merged);
    return merged;
  }
  function saveItem(item) {
    const items = getItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item; else items.push(item);
    write('vb_items', items);
  }

  return {
    getSales, saveSale, deleteSale, getSaleById, nextSaleNo,
    getPurchases, savePurchase, deletePurchase, getPurchaseById, nextPurNo,
    getParties, saveParty, deleteParty, getPartyById,
    getPartyBalances, setPartyBalance, getPartyBalance,
    getSettings, saveSettings,
    getItems, saveItem,
  };
})();
