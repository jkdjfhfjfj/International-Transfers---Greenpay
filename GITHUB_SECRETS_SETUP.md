# GitHub Secrets Setup for Android APK Build

## Firebase is Ready! ✅

Your Firebase project is configured:
- **Project ID**: greenpay-mobile-24b8d
- **Package**: com.greenpay.mobile
- **API Key**: AIzaSyD7D3worHICL0l67MmWYRq6-8cGKfnpX9o
- **File**: google-services.json (already placed in android/app/)

## Add 4 GitHub Secrets

Your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Secret 1: ANDROID_KEYSTORE_BASE64

You need to generate a signing key first:

```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias greenpay-key
```

Then convert to base64:
```bash
base64 -w 0 release.keystore > keystore.txt
cat keystore.txt
```

Copy the output and paste as: **ANDROID_KEYSTORE_BASE64**

### Secret 2: ANDROID_KEYSTORE_PASSWORD

The password you entered when creating the keystore

**Name**: ANDROID_KEYSTORE_PASSWORD  
**Value**: [Your keystore password]

### Secret 3: ANDROID_KEY_ALIAS

**Name**: ANDROID_KEY_ALIAS  
**Value**: greenpay-key

### Secret 4: ANDROID_KEY_PASSWORD

**Name**: ANDROID_KEY_PASSWORD  
**Value**: [Same password as keystore]

### Secret 5: FIREBASE_GOOGLE_SERVICES_JSON

Already configured! But if needed:

**Name**: FIREBASE_GOOGLE_SERVICES_JSON  
**Value**: (This will be auto-injected during build)

## Summary

After adding 4 secrets:

1. ✅ google-services.json placed
2. ✅ Capacitor configured for greenpay.world
3. ⏳ Generate keystore (locally)
4. ⏳ Add 4 GitHub secrets
5. ⏳ Push to GitHub

Then GitHub Actions automatically:
- Builds APK
- Signs it
- Uploads to Play Store

## Next Step

Generate your keystore and add the 4 secrets above, then:

```bash
git push origin main
```

Done! 🚀
