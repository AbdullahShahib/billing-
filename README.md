# 🥬 VegiBill TN — Vegetable Billing App

**Tamil Nadu Market Billing System** — Works in any browser. No server needed.

---

## 🚀 How to Run

### Option 1: Direct Open (Simple)
Just double-click `index.html` in your file manager.

### Option 2: VS Code Live Server (Recommended)
1. Open the `vegibill/` folder in VS Code
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. App opens at `http://localhost:5500`

### Option 3: Python HTTP Server
```bash
cd vegibill
python -m http.server 8000
# Open: http://localhost:8000
```

### Option 4: Node.js
```bash
cd vegibill
npx serve .
```

---

## 📁 File Structure

```
vegibill/
├── index.html              ← Main app entry point
├── README.md               ← This file
├── css/
│   └── style.css           ← All styles (dark theme, mobile-first)
└── js/
    ├── db.js               ← Data storage (LocalStorage)
    ├── utils.js            ← Helpers (date, currency, toast, modal)
    ├── print.js            ← 80mm thermal receipt generator
    ├── app.js              ← Router & navigation
    └── pages/
        ├── home.js         ← Dashboard
        ├── add-sale.js     ← New/Edit Sale form
        ├── sales.js        ← Sales list + Sale detail
        ├── add-purchase.js ← New/Edit Purchase form
        ├── purchase.js     ← Purchase list + Purchase detail
        └── parties.js      ← Parties list + Ledger + Date detail
```

---

## ✅ Features

| Feature | Description |
|---|---|
| 🧾 Add Sale | Bill with items, bags, qty, rate, price. Auto-calculates total. |
| 📦 Add Purchase | Same as sale, linked to a Party/Supplier |
| 👥 Parties | Supplier master. Date-wise purchase ledger. Editable balance. |
| 📋 Sales History | Filter by Today/Week/Month/Year or custom date |
| 🖨 Print | Single bill or Bulk print (80mm thermal receipt) |
| 📤 Share | WhatsApp / clipboard bill text |
| ⚖️ Sungam | Market levy / tax field per bill |
| 💰 Payment Method | Cash, UPI, Credit, Cheque |
| 🔍 Search | By bill no, customer name, mobile, date |
| ✏️ Edit Bills | Edit any saved sale or purchase |

---

## 🔥 Firebase Integration (Optional — For Cloud Sync)

To enable cloud storage, edit `js/db.js`:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Firestore Database**
3. Replace the `read()` and `write()` functions in `db.js` with:

```javascript
// In db.js — replace localStorage with Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
});
const db = getFirestore(app);
```

### Firestore Schema:
```
sales/{billId}
  ├── id: "SL01001"
  ├── createdAt: ISO string
  ├── partyName: "Customer name"
  ├── mobile: "9876543210"
  ├── items: [{itemName, bags, quantity, unit, pricePerUnit, totalPrice}]
  ├── subTotal: "500.00"
  ├── sungam: "10.00"
  ├── grandTotal: "510.00"
  ├── amountPaid: "510.00"
  └── paymentMethod: "Cash"

purchases/{billId}  ← same schema + partyId

parties/{partyId}
  ├── id, name, mobile, address, gstin
  └── createdAt

party_balances/{partyId_date}
  └── balance: 1500.00
```

---

## 📱 Install as PWA (Add to Home Screen)

1. Open in Chrome mobile
2. Tap the menu (⋮) → **Add to Home Screen**
3. App works like a native app!

---

## 🖨 Thermal Printer Setup

- **Paper Width**: 80mm (3 inch)
- **Method**: Click Print → Browser print dialog → Select your thermal printer
- **Tip**: Set margins to "None" in print dialog for best results

---

## 🛠 Customization

Edit these files to customize:
- **Shop Name/Address**: Go to Settings in the app (currently in `js/db.js` `getSettings()`)
- **Item List**: Edit `DEFAULT_ITEMS` in `js/db.js`
- **Colors**: Edit CSS variables in `css/style.css` `:root` block

---

*VegiBill TN — Made for Tamil Nadu கடைக்காரர்கள் 🌿*
