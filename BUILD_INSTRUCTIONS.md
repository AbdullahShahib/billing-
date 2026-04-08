# VegiBill TN — Multi-Platform Build Guide

Now your app works on **Desktop (Windows/Mac), Mobile (Android/iOS), and Web**! 🚀

## 📦 Project Structure After Rebuild

```
billing--main/
├── www/                    # Web files (Capacitor webDir)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── db.js, utils.js, print.js, app.js
│       └── pages/
├── electron/               # Desktop app (NEW)
│   ├── main.js
│   └── preload.js
├── android/                # Mobile app (Android)
│   ├── app/
│   ├── build.gradle
│   └── ...
├── capacitor.config.json   # Updated
└── package.json            # Updated with scripts
```

---

## 1️⃣ **DESKTOP (Windows/Mac/Linux)**

### Prerequisites
- Node.js 14+ and npm installed
- For Windows build: Visual Studio Build Tools or NSIS (for installer)

### Build Desktop App

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build standalone executable (Windows, Mac, Linux)
npm run build:electron
```

**Output:**
- Windows: `dist/VegiBill Setup 1.0.0.exe` (installer)
- Windows: `dist/VegiBill 1.0.0.exe` (portable)
- Mac: `dist/VegiBill-1.0.0.dmg`
- Linux: `dist/VegiBill-1.0.0.AppImage`

### Quick Development

```bash
npm run dev                # Run with DevTools
npm run web:serve         # Run web version locally (port 8000)
```

---

## 2️⃣ **MOBILE (Android)**

### Prerequisites
- Android SDK installed
- Android Studio (recommended)
- Java Development Kit (JDK 11+)

### Build APK for Testing

```bash
# Sync Capacitor with Android project
npm run android:sync

# Open Android Studio
npm run android:open

# In Android Studio: Build > Build Bundle(s)/APK(s) > Build APK(s)
```

**Output:**
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

### Deploy to Phone/Emulator

```bash
# Using ADB (Android Device Bridge)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Or use Android Studio to deploy
```

---

## 3️⃣ **WEB (Browser)**

### Run Locally

```bash
# Serve on localhost:8000
npm run web:serve

# Open browser: http://localhost:8000
```

### Deployment

The `www/` folder is a static web app:

1. **GitHub Pages**: Push `www/` folder to gh-pages branch
2. **Netlify**: Connect repo and set build folder to `www/`
3. **Vercel**: Deploy the `www/` folder
4. **Traditional Server**: Copy `www/` contents to web host

### Progressive Web App (PWA)

Add optional PWA support by creating `www/manifest.json`:

```json
{
  "name": "VegiBill TN",
  "short_name": "VegiBill",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

Add to `www/index.html` `<head>`:
```html
<link rel="manifest" href="manifest.json">
```

---

## 📋 Data Storage

All user data is stored **locally**:

- **Desktop/Web**: localStorage (IndexedDB option with update)
- **Mobile**: localStorage + native plugins for file access

**To Migrate to Cloud:**
- Replace `DB.read()` and `DB.write()` in `js/db.js`
- Use Firebase, Supabase, or custom backend

---

## 🛠️ Development Workflow

| Platform | Command | Port | Notes |
|----------|---------|------|-------|
| Desktop | `npm run dev` | Auto | Electron + DevTools |
| Web | `npm run web:serve` | 8000 | Browser dev tools |
| Android | `npm run android:open` | - | Android Studio |

---

## 📱 Testing Checklist

- [ ] Desktop app starts and loads data
- [ ] Mobile APK installs and runs
- [ ] Web version loads in all browsers
- [ ] localStorage persists data
- [ ] Printing works (print preview)
- [ ] Keyboard shortcuts work (Ctrl+N, Ctrl+P, Ctrl+S)
- [ ] Responsive design on mobile

---

## 🚀 Next Steps

1. **Update App Icon**: Replace icon in `assets/` folder
2. **Customize Settings**: Edit default settings in `js/db.js`
3. **Add Cloud Backup**: Integrate Firebase/Supabase
4. **Release**: Build final executables and APK for distribution

---

## ⚙️ Useful Scripts

```bash
npm install                # Install all dependencies
npm run build              # Build all (desktop + Android)
npm run build:electron     # Build desktop only
npm run android:sync       # Sync with Android project
npm run web:serve          # Test web locally
npm run start              # Run desktop app
```

---

## 📝 Environment Info

- **App Name**: VegiBill TN
- **App ID**: com.vegibill.app
- **Version**: 1.0.0
- **Platforms**: Windows, Mac, Linux, Android, Web
- **Tech Stack**: Vanilla JS, Capacitor, Electron, HTML/CSS

---

**Questions?** Check individual platform docs:
- [Electron Docs](https://www.electronjs.org/docs)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Docs](https://developer.android.com)
