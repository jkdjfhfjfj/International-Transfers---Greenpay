# GitHub Actions Setup Guide for Play Store Builds

## Overview
Automated Android builds and Play Store releases using GitHub Actions

## Workflow File
**Location**: `.github/workflows/android-build.yml`

Triggers on:
- Every push to `main` branch
- Manual workflow dispatch (for different release tracks)

## Required GitHub Secrets

### 1. Android Keystore (Required)

Generate keystore:
```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias greenpay-key \
  -storepass MyStorePass123 \
  -keypass MyKeyPass123 \
  -dname "CN=GreenPay,O=GreenPay,L=Nairobi,ST=KE,C=KE"
```

Encode to base64:
```bash
base64 -w 0 release.keystore > keystore.txt
cat keystore.txt
```

Set as GitHub secret:
- **Name**: `ANDROID_KEYSTORE_BASE64`
- **Value**: Paste base64 encoded keystore content

Additional secrets:
- **`ANDROID_KEYSTORE_PASSWORD`**: `MyStorePass123`
- **`ANDROID_KEY_ALIAS`**: `greenpay-key`
- **`ANDROID_KEY_PASSWORD`**: `MyKeyPass123`

### 2. Google Play Service Account (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create Service Account:
   - New Project or use existing
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `greenpay-github`
   - Grant roles: `Editor`

3. Create JSON Key:
   - Service Account → Keys → Create Key
   - Select `JSON` format
   - Copy entire JSON content

4. Set as GitHub secret:
   - **Name**: `PLAY_STORE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste entire JSON key

5. Grant Play Console Access:
   - Google Play Console → Settings → User and permissions
   - Invite service account email with "Admin" role

## Setting GitHub Secrets

1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add all required secrets above

## Build Triggers

### Automatic Build (Internal Testing)
- Push code to `main`
- Workflow uploads to Play Store internal testing track
- Status: Draft (not published)

### Manual Builds

1. Go to Actions tab
2. Select "Android Build & Release to Play Store"
3. Click "Run workflow"
4. Choose release type:
   - **internal**: Draft upload to internal testing
   - **alpha**: Draft upload to alpha channel
   - **beta**: Draft upload to beta channel
   - **production**: Immediate release to all users

## Workflow Steps

1. **Checkout Code** - Clone repository
2. **Setup Node** - Install Node 18
3. **Setup Java** - Install Java 17
4. **Setup Android SDK** - Configure Android tools
5. **Install Dependencies** - npm ci
6. **Build Web App** - npm run build
7. **Sync to Android** - Capacitor sync
8. **Decode Keystore** - Prepare signing credentials
9. **Build Bundle** - Generate Android App Bundle
10. **Upload to Play Store** - Release via Google Play API

## Monitoring Builds

1. Go to Actions tab
2. Click workflow run
3. View build logs in real-time
4. Check for errors or warnings

## Play Store Console

After successful upload:

1. Go to Google Play Console
2. Select app
3. Release → Internal testing (or chosen track)
4. Review app details, features, screenshots
5. Click "Release" to publish

## Version Management

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.greenpay.mobile"
        minSdkVersion 24
        targetSdkVersion 33
        versionCode 1      // Increment for EVERY build
        versionName "1.0.0" // User version
    }
}
```

**Important**: GitHub Actions fails if versionCode isn't incremented.

## Troubleshooting

### Build Fails with "Invalid keystore"
- Verify base64 encoding is correct
- Ensure password is exact match
- Regenerate keystore if needed

### Play Store Upload Fails
- Check service account has Play Console Admin role
- Verify correct app ID: `com.greenpay.mobile`
- Check versionCode is unique

### Gradle Errors
- Clear Android cache: `rm -rf android/.gradle`
- Increase Gradle heap: `org.gradle.jvmargs=-Xmx2048m`

### Web App Not Building
- Ensure `client/dist` is created
- Check `capacitor.config.ts` has correct `webDir`

## Security Best Practices

1. **Never commit**:
   - Keystores
   - Service account JSON
   - Passwords or keys

2. **Rotate credentials annually**
3. **Use different keystores** for dev/test/prod
4. **Audit** GitHub Actions logs regularly
5. **Limit secret access** to necessary workflows

## Useful Commands

Check latest build:
```bash
gh run list --workflow=android-build.yml --limit=5
```

View build logs:
```bash
gh run view <run-id> --log
```

## Support

For issues:
1. Check GitHub Actions logs
2. Verify all secrets are set
3. Ensure Android SDK is latest
4. Test locally: `npm run build && npx cap sync android`
