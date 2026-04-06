# Backend URL Configuration for GreenPay Mobile App

## Overview

The GreenPay Android app needs to know where to connect to for API calls. This guide explains how to configure the backend URL for different environments.

## Configuration Methods

### Method 1: Environment Variable (Build Time)

Set `VITE_API_URL` in your `.env` or `.env.production` file:

```bash
# Production
VITE_API_URL=https://api.greenpay.world

# Development (local machine)
VITE_API_URL=http://localhost:5000

# Development (network machine)
VITE_API_URL=http://192.168.1.100:5000

# Android emulator (host machine)
VITE_API_URL=http://10.0.2.2:5000
```

### Method 2: Capacitor Config

Edit `capacitor.config.ts`:

```typescript
server: {
  url: 'https://api.greenpay.world',  // Your backend URL
  cleartext: false,                     // Only true in development
}
```

### Method 3: Auto-Detection (Default)

The app automatically detects:
1. Environment variable: `VITE_API_URL`
2. Capacitor configuration: `server.url`
3. Runtime: Uses current origin for web, `api.greenpay.world` for mobile

## Which URL to Use?

### 🌍 Web App (Browser)
```
Use relative paths: /api/auth/login
→ Works because web and backend on same domain
```

### 📱 Android App (Development)
```
Local machine: http://localhost:5000
  ⚠️ Won't work - device can't reach your computer

Network machine: http://192.168.1.100:5000
  ✅ Works if on same WiFi

Android emulator: http://10.0.2.2:5000
  ✅ Special address to reach host machine
```

### 📱 Android App (Production)
```
Production: https://api.greenpay.world
  ✅ Works everywhere
```

## Setup by Environment

### Development (Emulator)

```bash
# 1. Find your machine's local IP
# macOS/Linux:
ifconfig | grep "inet "

# Windows:
ipconfig | findstr "IPv4"

# 2. Set in .env
VITE_API_URL=http://YOUR_LOCAL_IP:5000
CAPACITOR_SERVER_URL=http://YOUR_LOCAL_IP:5000

# 3. Start backend
npm run dev
# Backend running on http://YOUR_LOCAL_IP:5000

# 4. Build and run Android app
npx cap sync android
npx cap open android
# Run on Android Studio emulator
```

### Development (Device)

```bash
# Same as emulator, but need device on same network
# And need to allow HTTP traffic (not just HTTPS)
CAPACITOR_ALLOW_CLEARTEXT=true

# Build APK with HTTP support
./gradlew assembleDebug
```

### Development (Localhost)

```bash
# For web development only
VITE_API_URL=http://localhost:5000

# Run backend
npm run dev

# Run web app
cd client && npm run dev
```

### Production (Play Store)

```bash
# Final .env for production build
VITE_API_URL=https://api.greenpay.world
CAPACITOR_SERVER_URL=https://api.greenpay.world
CAPACITOR_ALLOW_CLEARTEXT=false

# Build and deploy
npm run build
npx cap sync android
# Upload APK to Play Store
```

## Complete Setup Example

### Step 1: Find Your Machine IP

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127

# Output example:
# inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

### Step 2: Update .env

```bash
cat > .env.local << EOF
# Backend URLs
VITE_API_URL=http://192.168.1.100:5000
CAPACITOR_SERVER_URL=http://192.168.1.100:5000
CAPACITOR_ALLOW_CLEARTEXT=true

# Rest of config...
DATABASE_URL=...
EOF
```

### Step 3: Build and Test

```bash
# 1. Build web app
cd client
npm run build
cd ..

# 2. Sync to Android
npx cap sync android

# 3. Verify in Android config
cat android/app/src/main/AndroidManifest.xml | grep internet

# 4. Build APK
cd android
./gradlew assembleDebug
cd ..

# 5. Install and test
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 6. View logs
adb logcat | grep -i greenPayy
```

### Step 4: Check What URL App Is Using

The app logs the configuration on startup:

```bash
# View logs
adb logcat | grep "API\|Backend\|Config"

# Should show something like:
# API Base URL: http://192.168.1.100:5000
# Environment: development
# Platform: Android
```

## Troubleshooting

### App Can't Connect to Backend

**Issue**: Network error when making requests

**Causes**:
1. Wrong IP address in VITE_API_URL
2. Device not on same network
3. Backend not running
4. Firewall blocking connection
5. HTTPS required but using HTTP

**Solutions**:
```bash
# 1. Verify backend is running
curl http://192.168.1.100:5000/api/health

# 2. Check app is using correct URL
adb logcat | grep "Base URL"

# 3. Verify network connectivity
adb shell ping 192.168.1.100

# 4. Update .env and rebuild
VITE_API_URL=http://CORRECT_IP:5000
npm run build
npx cap sync android
./gradlew assembleDebug
```

### Emulator Can't Reach Host

**Issue**: App on Android emulator can't connect

**Solution**: Use `http://10.0.2.2:5000` instead of localhost

```bash
# .env
VITE_API_URL=http://10.0.2.2:5000
CAPACITOR_SERVER_URL=http://10.0.2.2:5000
```

### HTTPS Certificate Error

**Issue**: HTTPS request fails with certificate error

**Solutions**:
1. Use production URL (certificate valid)
2. Disable HTTPS for development:
   ```bash
   CAPACITOR_ALLOW_CLEARTEXT=true
   ```
3. Use self-signed cert + add to Android trust store

### App Works on Web but Not Mobile

**Likely Cause**: Using relative URLs that work for web but not for mobile

**Check**: 
```bash
# Should show development URL, not relative path
adb logcat | grep -i "api\|url"
```

**Fix**: Ensure `VITE_API_URL` is set to full URL

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Frontend API base URL | `https://api.greenpay.world` |
| `CAPACITOR_SERVER_URL` | Capacitor server URL | `https://api.greenpay.world` |
| `CAPACITOR_ALLOW_CLEARTEXT` | Allow HTTP in dev | `true` (dev only!) |
| `NODE_ENV` | Build environment | `development` / `production` |
| `FIREBASE_PROJECT_ID` | Firebase project | `greenpay-mobile` |

## Quick Reference

```bash
# Development (emulator on same machine)
VITE_API_URL=http://10.0.2.2:5000

# Development (physical device, local network)
VITE_API_URL=http://192.168.1.100:5000

# Production (everywhere)
VITE_API_URL=https://api.greenpay.world

# Allow HTTP in development (NEVER in production!)
CAPACITOR_ALLOW_CLEARTEXT=true

# After changing:
npm run build
npx cap sync android
./build-apk.sh debug
```

## Common URLs by Setup

### Replit Development
```
Backend: https://[your-replit-url].replit.dev
VITE_API_URL=https://[your-replit-url].replit.dev
```

### Local Docker
```
VITE_API_URL=http://172.17.0.1:5000
```

### Cloud (AWS, GCP, Azure)
```
VITE_API_URL=https://api.yourdomain.com
```

### Custom Domain
```
VITE_API_URL=https://api.greenpay.world
```

## Verify Configuration

Test the API endpoint:

```bash
# Get your configured URL
BACKEND_URL=$VITE_API_URL

# Test connectivity
curl -X GET "$BACKEND_URL/api/health" \
  -H "Content-Type: application/json"

# Should return 200 OK with health status
```

## After Changing URL

Always rebuild when changing `VITE_API_URL`:

```bash
# 1. Update .env
VITE_API_URL=http://new-url:5000

# 2. Clean build
rm -rf client/dist
rm -rf android/app/build

# 3. Rebuild
npm run build

# 4. Sync
npx cap sync android

# 5. Rebuild APK
./gradlew assembleDebug

# 6. Reinstall
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

**Updated**: 2026-04-06  
**Status**: ✅ Ready to Configure
