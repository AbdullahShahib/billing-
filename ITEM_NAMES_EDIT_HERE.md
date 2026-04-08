# 📝 Item Names Configuration

## Where to Edit Your 30 Item Names

Go to: **js/db.js** (line 110 - 175)

### Current Structure (Example):
```javascript
const DEFAULT_ITEMS = [
  { id: 'onion',       name: 'Onion',        tamil: 'வெங்காயம்', unit: 'kg',    emoji: '🧅' },
  { id: 'tomato',      name: 'Tomato',       tamil: 'தக்காளி', unit: 'kg',    emoji: '🍅' },
  { id: 'potato',      name: 'Potato',       tamil: 'உருளைக்கிழங்கு', unit: 'kg',    emoji: '🥔' },
  // ... more items
];
```

### Fields to Edit:
- **id**: Unique identifier (lowercase, no spaces)
- **name**: English name (used for autocomplete search)
- **tamil**: Tamil name (shown in dropdown)
- **price**: Default price per unit (you can change it in Items page)
- **unit**: 'kg', 'g', 'pc', 'bunch', 'bag', 'dozen', or 'quintal'
- **emoji**: Food emoji (optional, just for display)

## How Autocomplete Works

1. **When typing** in the item name field with 2+ characters, suggestions appear
2. **Matching logic**: Searches both English AND Tamil names
3. **Click to select**: Clicking a suggestion fills the field and moves to next
4. **Max 6 suggestions** shown at once

## Example: Add Your Item Names

Replace items in `js/db.js` line 110 with your 30 items:

```javascript
const DEFAULT_ITEMS = [
  { id: 'carrot',      name: 'Carrot',       tamil: 'கேரட்', unit: 'kg',    emoji: '🥕' },
  { id: 'capsicum',    name: 'Capsicum',     tamil: 'குடமிளகாய்', unit: 'kg',    emoji: '🫑' },
  // Add 28 more items following the same format
];
```

## How to Access

**File Path**: c:\Users\sudha\Downloads\billing--main\billing--main\js\db.js

**Line Range**: 110-175 (DEFAULT_ITEMS array)

After editing, refresh the browser and start typing in any item name field!
