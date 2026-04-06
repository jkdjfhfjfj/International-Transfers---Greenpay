# GreenPay Mobile App - Complete Guide

## Quick Overview

GreenPay is now available as an Android app with:
- **Push Notifications**: Real-time alerts for KYC, transactions, withdrawals, bills
- **Native Integration**: Uses Capacitor for native Android features
- **Play Store Ready**: Automated CI/CD pipeline for building and releasing
- **Admin Control**: Send targeted or broadcast notifications to users
- **Offline Support**: Works without internet (limited features)

## For Users

### Download & Install

**From Google Play Store** (Coming Soon)
- Search for "GreenPay"
- Tap Install
- Allow notifications when prompted
- Log in with your credentials

**For Testers** (Internal/Alpha/Beta)
- Get invite from admin
- Download from Google Play → My apps & games → Installed
- Follow on-screen instructions

### Features

✅ **All web app features work in mobile app**
- Send/receive money
- Virtual cards
- Bill payments
- Airtime top-ups
- Withdrawals
- Account settings

✅ **Mobile-exclusive features**
- 📲 Push notifications (KYC, transactions, withdrawals)
- 👆 Biometric authentication (fingerprint)
- 💾 Offline data caching
- 📦 App shortcuts
- 🔔 Smart notifications

### Notification Types

| Type | When | Action |
|------|------|--------|
| **KYC** | Verification status changes | Navigate to KYC page |
| **Transaction** | Money sent/received | Navigate to Transactions |
| **Withdrawal** | Withdrawal status update | Navigate to Withdrawals |
| **Bill Payment** | Bill status update | Navigate to Bills |
| **Admin Alert** | Admin sends message | Navigate to Dashboard |

### Notification Permissions

When you first open the app:
1. Android requests notification permission
2. Tap "Allow" to receive push notifications
3. Go to Settings → Apps → GreenPay → Notifications if you change your mind

## For Admins

### Send Push Notifications

**Location**: `/admin-notifications`

**How to send**:
1. Choose notification type:
   - **Single User**: Pick one user from dropdown
   - **Multiple Users**: Enter user IDs (one per line)
   - **All Users**: Broadcast to everyone

2. Write message:
   - **Title**: Short headline
   - **Message**: Longer description

3. Click **Send**

**Examples**:
- Broadcast: "Maintenance in 30 minutes"
- To specific user: "Your KYC is approved!"
- To group: "New bill payment feature available"

### Admin Logging

All notification sends are logged:
- Admin who sent it
- Recipient users
- Timestamp
- Success/failure status

### Best Practices

✅ **DO**:
- Send important updates immediately
- Use clear, concise titles
- Test with single user first
- Avoid sending at night hours

❌ **DON'T**:
- Send more than 2 per hour to same user
- Use marketing promotions
- Send duplicate notifications
- Spam all users with test messages

## For Developers

### Setup & Build

```bash
# 1. Install dependencies
npm install @capacitor/core @capacitor/cli --legacy-peer-deps

# 2. Add Android platform
npx cap add android

# 3. Build web app
npm run build --workspace=client

# 4. Sync with Android
npx cap sync android

# 5. Open in Android Studio
npx cap open android
# Then: Run → Run 'app'
```

### Project Structure

```
greenpay/
├── android/              # Android native code (auto-generated)
├── capacitor.config.ts   # App configuration
├── native/
│   └── plugins/          # Custom native features
│       ├── push-notifications.ts
│       ├── biometric.ts
│       └── file-storage.ts
├── client/dist/          # Built web app (auto-synced)
└── server/
    └── services/
        ├── fcm.ts        # Firebase Cloud Messaging
        └── notification-queue.ts
```

### Architecture

**Mobile App Stack**:
```
Android Device
    ↓
Capacitor (Bridge)
    ↓
React Web App (client/src)
    ↓
Express Backend (server/)
    ↓
PostgreSQL Database
```

**Push Notification Flow**:
```
Admin Panel → Backend API → Firebase Cloud Messaging
    ↓
Firebase Server
    ↓
Device Notification Manager
    ↓
User Notification
```

### Key Files

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | App ID, web directory, plugins config |
| `android/app/google-services.json` | Firebase configuration |
| `server/services/fcm.ts` | Firebase Cloud Messaging service |
| `server/services/notification-queue.ts` | Notification helpers |
| `client/src/hooks/use-fcm.ts` | FCM initialization hook |
| `client/src/pages/admin-notifications.tsx` | Admin notification panel |
| `.github/workflows/android-build.yml` | CI/CD pipeline |

### Custom Native Features

#### Push Notifications
```typescript
import { initPushNotifications } from 'native/plugins/push-notifications';

await initPushNotifications();
// Token automatically sent to backend
```

#### Biometric Authentication
```typescript
import { authenticateBiometric } from 'native/plugins/biometric';

const authenticated = await authenticateBiometric('Unlock GreenPay');
```

#### File Storage
```typescript
import { FileStorage } from 'native/plugins/file-storage';

await FileStorage.saveCacheData('user_prefs', data);
const data = await FileStorage.getCacheData('user_prefs');
```

## Build & Release

### Automated Builds (GitHub Actions)

**Automatic** (on every push to main):
- Builds web app
- Syncs to Android
- Creates release APK & bundle
- Uploads to Play Store (internal testing track)

**Manual** (workflow_dispatch):
- Choose build type: APK or AAB (App Bundle)
- Choose release track: internal / alpha / beta / production

### Manual Build

```bash
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=release.keystore \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=greenpay-key \
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Release Process

1. **Prepare**:
   - Update version in `android/app/build.gradle`
   - Commit changes
   - Push to main (triggers auto-build)

2. **Test**:
   - GitHub Actions workflow runs
   - Review build logs
   - Download APK from artifacts

3. **Release**:
   - Go to Google Play Console
   - Review release in internal testing track
   - Move to alpha/beta/production when ready
   - Users get automatic updates

## Testing

### Local Testing
```bash
# On Android device/emulator
npx cap open android
# Android Studio: Run → Run 'app'
```

**Test notifications**:
1. Go to `/admin-notifications`
2. Send test notification to your device
3. Should receive notification immediately
4. Tap to navigate to relevant page

### Device Testing
- Physical Android 10+ device recommended
- USB debugging enabled
- Connected to development machine

### Emulator Testing
- Android Studio emulator: API 30+
- Google Play services installed
- Firebase configured

## Deployment

### Play Store Setup (One-time)

1. **Create Google Play Developer account** ($25 one-time fee)
2. **Create app** on Play Console
3. **Generate signing key** (release.keystore)
4. **Create service account** for CI/CD
5. **Add GitHub Secrets**:
   - Keystore file (Base64)
   - Service account JSON
   - Key passwords

### Publishing

**Internal Testing Track** (Draft - for QA):
```
✅ Automatic on every push to main
```

**Alpha Track** (Limited rollout):
```
1. GitHub Actions → Run workflow
2. Select "alpha" track
3. Wait for build/upload
4. Play Console → Review → Release
```

**Production** (Full rollout):
```
1. Thoroughly test in alpha/beta first
2. GitHub Actions → Run workflow → "production"
3. Play Console → Review release
4. Click "Release" for public availability
5. Users get automatic updates
```

## Troubleshooting

### App Won't Build
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### App Crashes on Startup
- Check browser console for errors
- Verify `npm run build --workspace=client` succeeded
- Check `client/dist/` exists

### Notifications Don't Work
1. Check push notification permission granted
2. Verify FCM token in database
3. Go to admin panel → try sending test
4. Check browser console for errors

### Can't Connect to Backend
- Verify backend URL is correct
- Check internet connection
- For web version: uses same backend
- For mobile: check firewall/proxy

### GitHub Actions Build Fails
1. Check all secrets are set
2. Verify `google-services.json` in `android/app/`
3. Review detailed logs in Actions tab
4. Check versionCode is incremented

## API Endpoints (Admin)

**Send to Single User**
```
POST /api/admin/push-notifications/send-user
{
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
}
```

**Send to Multiple Users**
```
POST /api/admin/push-notifications/send-multiple
{
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
}
```

**Send to All Users**
```
POST /api/admin/push-notifications/send-all
{
  title: string,
  body: string,
  data?: Record<string, string>
}
```

## Monitoring

### Logs
- Backend: `server/` logs
- Mobile: Android Studio → Logcat
- Firebase: Firebase Console → Cloud Messaging

### Analytics (Future)
- Google Analytics for Firebase
- Crash reporting
- Performance monitoring
- User engagement

## Support

**User Issues**:
- WhatsApp support through app
- Live chat feature
- Email support

**Developer Issues**:
- GitHub Issues
- Slack #mobile-dev
- Firebase documentation
- Capacitor documentation

## Roadmap

- ✅ Push notifications
- ✅ Admin notification panel
- ⏳ Biometric authentication
- ⏳ Offline mode
- ⏳ App widget
- ⏳ Deep linking
- ⏳ Background sync

---

**Repository**: https://github.com/yourusername/greenpay  
**Play Store**: https://play.google.com/store (coming soon)  
**Firebase**: https://firebase.google.com/  
**Capacitor**: https://capacitorjs.com/  
**Android Studio**: https://developer.android.com/studio
