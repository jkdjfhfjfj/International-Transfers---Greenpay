# GreenPay Android APK Release Checklist

## Pre-Release Setup (One-time)

### Step 1: Generate Signing Key ✅
- [ ] Run `keytool` to generate release.keystore
- [ ] Store keystore in secure location (NOT in Git)
- [ ] Record passwords in secure password manager
- [ ] Test signing with generated keystore

### Step 2: Firebase Project ✅
- [ ] Create Firebase project: greenpay-mobile
- [ ] Register Android app (com.greenpay.mobile)
- [ ] Download google-services.json
- [ ] Enable Cloud Messaging
- [ ] Create service account
- [ ] Download service account JSON

### Step 3: GitHub Secrets ✅
- [ ] Convert keystore to base64: `base64 -w 0 release.keystore`
- [ ] Add `ANDROID_KEYSTORE_BASE64` secret
- [ ] Add `ANDROID_KEYSTORE_PASSWORD` secret
- [ ] Add `ANDROID_KEY_ALIAS` secret
- [ ] Add `ANDROID_KEY_PASSWORD` secret
- [ ] Add `FIREBASE_GOOGLE_SERVICES_JSON` secret
- [ ] Verify all secrets in GitHub Settings → Secrets

### Step 4: Google Play Developer Account ✅
- [ ] Create/access Google Play Developer account ($25 one-time)
- [ ] Create new app: GreenPay
- [ ] Accept terms and policies
- [ ] Set up app details (name, description, icon)
- [ ] Create service account for Play Console
- [ ] Generate Play Console API credentials
- [ ] Grant app release permissions to service account

### Step 5: Local Testing ✅
- [ ] Build debug APK: `./gradlew assembleDebug`
- [ ] Install on device: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Test all features
- [ ] Test push notifications
- [ ] Verify camera, location, storage permissions work

## Pre-Release Verification (Each Release)

### Code Quality
- [ ] All features working
- [ ] No console errors
- [ ] No warning messages
- [ ] Performance acceptable
- [ ] Battery/data usage reasonable

### Testing
- [ ] Login/signup works
- [ ] KYC verification works
- [ ] Transactions complete
- [ ] Withdrawals process
- [ ] Bills pay correctly
- [ ] Airtime purchases work
- [ ] Virtual cards functional
- [ ] Push notifications arrive
- [ ] Admin panel sends notifications

### Version Update
- [ ] Increment versionCode in android/app/build.gradle
- [ ] Update versionName semantically (1.0.0 → 1.0.1)
- [ ] Update CHANGELOG.md
- [ ] Update README with new features
- [ ] Commit changes: `git commit -m "Release v1.0.1"`

### Build Verification
- [ ] Local debug build succeeds
- [ ] Local release build succeeds (with keystore)
- [ ] APK installs without errors
- [ ] App launches successfully
- [ ] All features work in installed APK

## Automated Release (GitHub Actions)

### Option 1: Automatic (Recommended)
```bash
# Push to main automatically triggers build
git push origin main

# Actions:
#   1. Builds web app
#   2. Syncs to Android
#   3. Creates signed APK
#   4. Creates signed bundle (AAB)
#   5. Uploads to Play Store (internal track)
#   6. Saves artifacts

# Review in:
#   - GitHub Actions tab (logs, artifacts)
#   - Play Console → Internal testing track (draft)
```

### Option 2: Manual Dispatch
1. GitHub repo → Actions tab
2. Select "Build Android APK & Release"
3. Click "Run workflow"
4. Choose: apk or aab build type
5. Choose: internal/alpha/beta/production track
6. Wait for completion
7. Check Play Console

## Play Store Release

### Internal Testing (Draft)
- [ ] Build completes on GitHub Actions
- [ ] Go to Play Console → Internal testing
- [ ] Review build details
- [ ] Edit release notes
- [ ] Preview app details
- [ ] Leave in draft (don't release yet)

### Alpha Testing (Limited Rollout)
- [ ] Internal testing verified stable
- [ ] Trigger manual GitHub Actions workflow
- [ ] Select "alpha" release track
- [ ] Go to Play Console → Alpha testing
- [ ] Review and edit release
- [ ] Click "Release" to start alpha testing
- [ ] Share link with alpha testers
- [ ] Collect feedback for 3-5 days

### Beta Testing (Wider Rollout)
- [ ] Alpha feedback addressed
- [ ] Fixes implemented and tested
- [ ] Trigger GitHub Actions with "beta" track
- [ ] Go to Play Console → Beta testing
- [ ] Review and release
- [ ] Announce beta to community
- [ ] Monitor for 5-7 days
- [ ] Address critical issues

### Production Release (Full Launch)
- [ ] Beta testing successful
- [ ] No critical issues
- [ ] All features verified
- [ ] Marketing materials ready
- [ ] Trigger GitHub Actions with "production" track
- [ ] Go to Play Console → Production
- [ ] Review all details:
      - App name, description, screenshots
      - Permissions, privacy policy
      - Release notes
      - Target audience
- [ ] Click "Release" for public availability
- [ ] Monitor crash reports and ratings
- [ ] Respond to user reviews

## Artifact Management

### GitHub Artifacts
- Stored for 90 days by default
- Available in Actions tab
- Download APK for manual distribution
- Use for testing or backup

### Play Store
- Builds saved indefinitely
- Can roll back to previous versions
- Version history in Play Console
- User automatic update via Play Store

## Monitoring & Support

### Firebase Console
- [ ] Monitor push notification metrics
- [ ] Track FCM token registration
- [ ] View crash reports
- [ ] Check performance monitoring

### Google Play Console
- [ ] Monitor crash reports daily
- [ ] Review user ratings/reviews
- [ ] Track install/uninstall metrics
- [ ] Monitor daily/monthly active users
- [ ] Check revenue (if applicable)
- [ ] Review user feedback

### Analytics
- [ ] Track user engagement
- [ ] Monitor feature usage
- [ ] Identify performance bottlenecks
- [ ] Plan improvements

## Emergency Procedures

### If Build Fails

1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Check google-services.json is valid
4. Verify versionCode was incremented
5. Look for ProGuard/Gradle errors
6. Test local build: `./gradlew assembleRelease`
7. Fix issues, recommit, push

### If APK Won't Install

1. Ensure APK signed with same keystore
2. Check versionCode is higher than previous
3. Verify package name is correct
4. Remove old APK: `adb uninstall com.greenpay.mobile`
5. Try again

### If App Crashes

1. View device logs: `adb logcat | grep GreenPay`
2. Check Firebase crash reports
3. Test in emulator first
4. Verify all dependencies loaded
5. Check internet connectivity
6. Review server logs

### If Push Notifications Don't Work

1. Verify google-services.json is valid
2. Check Firebase project exists and is enabled
3. Ensure GreenPayMessagingService is registered
4. Test FCM token registration
5. Try sending test notification from admin panel
6. Check device notification settings

## Version History

### v1.0.0
- [ ] Initial release
- [ ] All core features
- [ ] Push notifications
- [ ] Admin panel

### v1.0.1
- [ ] Bug fixes
- [ ] Performance improvements
- [ ] New features: [list]

## Post-Release

- [ ] Monitor crash reports for 24 hours
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] Plan next release features
- [ ] Update documentation
- [ ] Celebrate release! 🎉

## Quick Reference

### Commands
```bash
# Build
./build-apk.sh debug           # Quick debug build
./build-apk.sh release         # Release build (requires credentials)

# Test
adb install app.apk            # Install APK
adb uninstall com.greenpay.mobile  # Uninstall app
adb logcat                     # View logs

# Push to Play Store
git push origin main           # Auto-build and upload

# Manual trigger
# GitHub → Actions → Build Android APK & Release → Run workflow
```

### Important Files
- `android/app/build.gradle` - Version, signing, dependencies
- `android/app/google-services.json` - Firebase config
- `release.keystore` - Signing key (keep safe!)
- `.github/workflows/android-build.yml` - CI/CD pipeline
- `capacitor.config.ts` - App configuration

### URLs
- **Firebase Console**: https://console.firebase.google.com
- **Google Play Console**: https://play.google.com/console
- **GitHub Actions**: Your repo → Actions tab
- **GitHub Secrets**: Your repo → Settings → Secrets

## Support Contact

For issues or questions:
- GitHub Issues: Your repo
- Firebase Support: Firebase Console
- Play Store Help: Google Play Support
- Capacitor Docs: https://capacitorjs.com

---

**Updated**: 2026-04-06  
**Status**: ✅ Production Ready
