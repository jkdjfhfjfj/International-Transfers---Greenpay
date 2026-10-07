# GreenPay Mobile App Setup (Capacitor + Android)

## Quick Start

### 1. Initialize Android Project
```bash
npx cap add android
npx cap sync android
```

### 2. Build Web App
```bash
npm run build --workspace=client
```

### 3. Sync to Android
```bash
npx cap sync android
```

### 4. Open in Android Studio
```bash
npx cap open android
```

## GitHub Actions Setup

### Required Secrets

1. **ANDROID_KEYSTORE_BASE64** - Base64 encoded keystore file
   ```bash
   base64 -w 0 /path/to/keystore.jks
   ```

2. **ANDROID_KEYSTORE_PASSWORD** - Keystore password

3. **ANDROID_KEY_ALIAS** - Key alias name

4. **ANDROID_KEY_PASSWORD** - Key password

5. **PLAY_STORE_SERVICE_ACCOUNT_JSON** - Google Play Service Account JSON

### Generate Keystore (One-time)
```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias greenpay-key \
  -storepass your_store_password \
  -keypass your_key_password \
  -dname "CN=GreenPay,O=GreenPay,C=KE"
```

## Native Features (Ready to Add)

### Push Notifications
```bash
npm install @capacitor/push-notifications
npx cap sync
```

### Biometric Authentication
```bash
npm install @capacitor/native-biometric
npx cap sync
```

### File Storage
```bash
npm install @capacitor/filesystem
npx cap sync
```

### Camera
```bash
npm install @capacitor/camera
npx cap sync
```

### Geolocation
```bash
npm install @capacitor/geolocation
npx cap sync
```

### App Updates
```bash
npm install @capacitor/app
npx cap sync
```

## Project Structure

```
/
├── client/                 # React web app (unchanged)
│   └── dist/              # Built web files
├── android/               # Android native project (auto-generated)
├── capacitor.config.ts    # Capacitor configuration
├── MOBILE_SETUP.md        # This file
└── .github/workflows/
    └── android-build.yml  # GitHub Actions workflow
```

## Build Tracks

### Internal Testing
- Automatic on every push to `main`
- Draft status
- Testing by internal team only

### Alpha
- Manual trigger via workflow_dispatch
- Draft status
- Pre-release testing

### Beta
- Manual trigger via workflow_dispatch
- Draft status
- Public beta testing

### Production
- Manual trigger via workflow_dispatch
- Immediately available
- Creates GitHub release tag

## Manual Build

### Debug APK (Local)
```bash
cd android
./gradlew assembleDebug
```

### Release Bundle (Local)
```bash
cd android
./gradlew bundleRelease
```

## Environment Variables

The web app's environment variables are preserved. Capacitor uses the built web app from `client/dist/`.

## Testing on Device

1. Build web: `npm run build --workspace=client`
2. Sync: `npx cap sync android`
3. Connect Android device via USB
4. In Android Studio: Run → Run 'app'

## Troubleshooting

### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### Capacitor Sync Issues
```bash
npx cap sync android --no-build
```

### Web App Not Loading
- Check `client/dist/` exists
- Verify `webDir` in `capacitor.config.ts`

## Publishing to Play Store

1. Create app in Google Play Console
2. Generate Service Account JSON
3. Set `PLAY_STORE_SERVICE_ACCOUNT_JSON` secret
4. Trigger workflow with `release_type: production`
5. Monitor Play Console for release

## Versioning

Version is managed in `android/app/build.gradle`:
```gradle
versionCode = 1  // Increment for each release
versionName = "1.0.0"
```

Update before each release!
