# 🚀 QUICK START — Network Fix

## What Was Broken 🔴
- **All network requests**: "Network request failed" 
- **QR Scanner**: Not navigating after scan
- **Patient Login**: OTP flow failing

## What I Fixed ✅

### 1. Backend CORS (Line 1-13 of `server.js`)
```javascript
const cors = require("cors");
app.use(cors({...}));
```
**Install:** `npm install cors`

### 2. Frontend URL (Line 22 of `AuthScreen.js`)
```javascript
// OLD: 'http://localhost:8080' ❌ (doesn't work on mobile)
// NEW: 'http://192.168.108.160:8080' ✅ (your Mac's IP)
```

### 3. QR Scanner Navigation (QRScannerScreen.js)
```javascript
// NEW: Auto-navigates to RecordViewer on scan ✅
```

---

## The One Command You Need

```bash
cd backend && npm install cors && npm start
```

Then test in the app! 🎉

---

## Why This Works

| Platform | URL | Why |
|---|---|---|
| iOS Simulator | `localhost` | References host (your Mac) |
| Android Emulator | `10.0.2.2` | References host (your Mac) |
| Physical Device | `192.168.108.160` | Your Mac's LAN IP |

Your IP: **192.168.108.160**

---

## Troubleshooting

**IP changed?** Update AuthScreen.js line 22 again.  
**Server won't start?** Check port 8080: `lsof -i :8080`  
**Still getting network error?** Ensure backend is running and device is on same WiFi.
