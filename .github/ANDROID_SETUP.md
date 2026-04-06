# Android Setup Checklist

## Prerequisites
- [ ] Node.js 18+
- [ ] Java 17+
- [ ] Android SDK
- [ ] Android Studio

## Initial Setup

1. **Initialize Android**
   ```bash
   npx cap add android
   npx cap sync android
   ```

2. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

3. **Configure Build Signing**
   - File → Project Structure → Modules
   - Select "app"
   - Go to "Signing Configs"
   - Create new signing config with your keystore

## GitHub Actions Setup

### Step 1: Generate Keystore
```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias greenpay-key
```

### Step 2: Encode Keystore
```bash
base64 -w 0 release.keystore > keystore.txt
# Copy output to ANDROID_KEYSTORE_BASE64 secret
```

### Step 3: Set GitHub Secrets
Go to Settings → Secrets and variables → Actions

**Add these secrets:**
- `ANDROID_KEYSTORE_BASE64` - Base64 encoded keystore
- `ANDROID_KEYSTORE_PASSWORD` - Keystore password
- `ANDROID_KEY_ALIAS` - Key alias (e.g., greenpay-key)
- `ANDROID_KEY_PASSWORD` - Key password
- `PLAY_STORE_SERVICE_ACCOUNT_JSON` - Play Store JSON

### Step 4: Get Play Store Service Account
1. Go to Google Cloud Console
2. Create Service Account
3. Create JSON key
4. Grant Play Console Admin role
5. Copy JSON content to secret

## App Configuration

### capacitor.config.ts
- `appId`: com.greenpay.mobile (package name)
- `appName`: GreenPay
- `webDir`: client/dist (web app build location)

## Testing Build

### Local Build
```bash
npm run build --workspace=client
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Install on Device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Port 5037 Already in Use
```bash
adb kill-server
adb start-server
```

### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### Clear Android Cache
```bash
rm -rf android/.gradle
rm -rf android/app/.gradle
```

## Version Management

Update in `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode = 2  // Increment for each release
        versionName = "1.0.1"  // User-facing version
    }
}
```

## Release Process

1. **Internal Testing**
   - Push to main → Automatic upload to internal testing track

2. **Alpha/Beta**
   - Trigger workflow: `release_type: alpha` or `beta`
   - Review in Play Console
   - Release when ready

3. **Production**
   - Trigger workflow: `release_type: production`
   - Immediately released
   - GitHub tag created automatically
