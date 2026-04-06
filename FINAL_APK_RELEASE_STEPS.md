# GreenPay Android APK - Final Release Steps ✅

## Status So Far
✅ Firebase configured (google-services.json in place)  
✅ Capacitor setup for greenpay.world  
✅ Push notifications ready  
✅ Offline mode ready  
⏳ GitHub secrets needed

---

## What You Need to Do Now

### Step 1: Generate Release Keystore (LOCAL - One Time Only)

Run this command **once** on your computer:

```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias greenpay-key
```

**When prompted, enter:**
```
Enter keystore password: [Create something strong, e.g., MySecure123!]
Re-enter password: [Same password]
What is your first and last name? GreenPay
What is the name of your organizational unit? Engineering
What is the name of your organization? GreenPay
What is the name of your City? Nairobi
What is the name of your State/Province? Nairobi
What is the two-letter country code? KE
```

**SAVE THIS KEYSTORE FILE SAFELY** - You'll need the password later.

---

### Step 2: Convert Keystore to Base64

Still on your computer, run:

```bash
base64 -w 0 release.keystore > keystore.txt
cat keystore.txt
```

This prints a long string starting with `MIIJrQI...`

**Copy this entire string** - you'll paste it to GitHub.

---

### Step 3: Add GitHub Secrets

Go to your GitHub repo:

1. Click **Settings** (top menu)
2. Click **Secrets and variables** (left menu)
3. Click **Actions**
4. Click **New repository secret** (green button)

Add these **4 secrets** one by one:

#### Secret #1: ANDROID_KEYSTORE_BASE64
- **Name**: `ANDROID_KEYSTORE_BASE64`
- **Value**: [Paste the long string from keystore.txt]

#### Secret #2: ANDROID_KEYSTORE_PASSWORD
- **Name**: `ANDROID_KEYSTORE_PASSWORD`
- **Value**: [The password you created in Step 1]

#### Secret #3: ANDROID_KEY_ALIAS
- **Name**: `ANDROID_KEY_ALIAS`
- **Value**: `greenpay-key`

#### Secret #4: ANDROID_KEY_PASSWORD
- **Name**: `ANDROID_KEY_PASSWORD`
- **Value**: [Same password as Secret #2]

---

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Release v1.0.0 with Firebase and offline support"
git push origin main
```

---

## What Happens Next (Automatic)

GitHub Actions triggers automatically:

✅ **Build** - Compiles web app  
✅ **Sync** - Syncs to Android  
✅ **Sign** - Signs APK with your keystore  
✅ **Upload Artifacts** - Saves APK to GitHub  
✅ **Upload to Play Store** - Sends to internal testing track  

**Monitor Progress:**
- Go to your repo
- Click **Actions** tab
- Watch "Build Android APK & Release" workflow

---

## After Build Completes

### Option A: Download APK from GitHub

1. Go to **Actions** tab
2. Click the completed workflow
3. Download artifact: `GreenPay-release.apk`
4. Install on any Android device

### Option B: Get from Google Play

1. Go to https://play.google.com/console
2. Select your app (GreenPay)
3. Go to **Release** → **Internal testing**
4. Share link with testers
5. They install from Play Store

### Option C: Test Notifications

1. Install APK on Android device
2. Open GreenPay app
3. Allow notification permission when prompted
4. Go to **Admin Panel** → **Push Notifications**
5. Send test notification to your device
6. ✅ Receive notification instantly!

---

## Testing Offline Mode

On Android device:
1. Open GreenPay app
2. Toggle **Airplane Mode** on
3. App continues working with cached data ✅
4. Shows orange "You're offline" banner
5. Can view balance, transactions, cards
6. Toggle Airplane Mode off
7. Shows green "Back online" banner
8. Data syncs automatically

---

## Troubleshooting

### "Build failed"
- Check GitHub Actions logs for error
- Common: Wrong password in secrets
- Solution: Verify all 4 secrets are correct

### "APK won't install"
```bash
adb uninstall com.greenpay.mobile
adb install GreenPay-release.apk
```

### "Notifications don't work"
- Check device notifications enabled
- Check user is logged in
- Check admin panel can send notifications
- View backend logs

---

## Quick Checklist

- [ ] Generated keystore locally
- [ ] Converted to base64
- [ ] Added 4 GitHub secrets
- [ ] Pushed to main
- [ ] Watched GitHub Actions complete
- [ ] Downloaded APK
- [ ] Installed on device
- [ ] Logged in
- [ ] Allowed notifications
- [ ] Sent test notification
- [ ] Received it! ✅

---

## Version Updates (Future Releases)

Each time you release:

1. Update version code:
   ```gradle
   versionCode 2  // Was 1, now 2
   ```

2. Push to GitHub:
   ```bash
   git commit -m "Release v1.0.1"
   git push origin main
   ```

3. GitHub Actions auto-builds with new version

---

## Support

If stuck:
- Check Google Firebase Console
- Review GitHub Actions logs
- Read NATIVE_APK_BUILD.md for details
- Check Android logcat: `adb logcat | grep GreenPay`

---

**Everything is ready!** Just follow the 4 steps above. 🚀
