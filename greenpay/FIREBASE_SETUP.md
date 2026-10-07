# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
GreenPay now supports push notifications for KYC, transactions, withdrawals, and bill payments. This guide covers Firebase Cloud Messaging setup for the Android mobile app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Project name: `GreenPay Mobile`
4. Accept Firebase terms
5. Disable Google Analytics (or enable if needed)
6. Click "Create project"

## Step 2: Create Android App in Firebase

1. In Firebase Console, click **Add app**
2. Select **Android**
3. Fill in details:
   - **Package name**: `com.greenpay.mobile`
   - **App nickname**: `GreenPay Android` (optional)
4. Click **Register app**
5. **Download** `google-services.json`
6. Place in: `android/app/google-services.json`

## Step 3: Get Service Account Credentials

1. Go to Firebase Console → **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate new private key**
4. A JSON file downloads automatically
5. Copy the entire JSON content

## Step 4: Add GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

### Android Keystore Secrets
```
ANDROID_KEYSTORE_BASE64        # Base64-encoded release.keystore
ANDROID_KEYSTORE_PASSWORD      # Keystore password
ANDROID_KEY_ALIAS              # greenpay-key
ANDROID_KEY_PASSWORD           # Key password
```

### Firebase Service Account Secret
```
FIREBASE_SERVICE_ACCOUNT_JSON  # Entire service account JSON
```

## Step 5: Create Android Keystore (if not already done)

```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias greenpay-key
```

### Encode to Base64 for GitHub Secret:
```bash
base64 -w 0 release.keystore > keystore.txt
# Copy content of keystore.txt to ANDROID_KEYSTORE_BASE64 secret
```

## Step 6: Set Environment Variables

Add to `.env` or deployment:
```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT=your-service-account-json-content
```

## Step 7: Install Dependencies

```bash
# Already installed via package.json
npm install @capacitor/push-notifications --legacy-peer-deps
```

## Backend Integration

### FCM Service (`server/services/fcm.ts`)
- Handles token authentication with Firebase
- Sends notifications to individual users or topics
- Supports batch multicast sending (up to 500 tokens per request)

### Notification Queue (`server/services/notification-queue.ts`)
Provides helper methods:
- `sendKYCNotification()` - KYC status updates
- `sendTransactionNotification()` - Send/receive money
- `sendWithdrawalNotification()` - Withdrawal status
- `sendBillPaymentNotification()` - Bill payment status
- `sendAirtimeNotification()` - Airtime purchases
- `sendAdminAlert()` - Custom admin messages
- `sendBulkNotification()` - Multiple users or all users

### API Endpoints

**Register FCM Token (User)**
```
POST /api/fcm/register-token
Body: { token: "fcm_token_here" }
```

**Send to Single User (Admin)**
```
POST /api/admin/push-notifications/send-user
Body: {
  userId: "user_id",
  title: "Notification Title",
  body: "Notification message"
}
```

**Send to Multiple Users (Admin)**
```
POST /api/admin/push-notifications/send-multiple
Body: {
  userIds: ["user_id_1", "user_id_2"],
  title: "Title",
  body: "Message"
}
```

**Send to All Users (Admin)**
```
POST /api/admin/push-notifications/send-all
Body: {
  title: "Title",
  body: "Message"
}
```

## Frontend Integration

### Automatic FCM Initialization
The `useFCM()` hook (added to App.tsx) automatically:
1. Requests notification permissions
2. Registers device with FCM
3. Sends token to backend
4. Listens for incoming notifications
5. Handles notification taps with navigation

### Using Notifications in Code

```typescript
import { notificationQueue } from '@/services/notification-queue';

// Send KYC notification
await notificationQueue.sendKYCNotification(userId, 'verified');

// Send transaction notification
await notificationQueue.sendTransactionNotification(
  userId, 
  'received', 
  '100.00',
  'John Doe'
);
```

## Admin Panel

### Push Notification Manager
- **Location**: `/admin-notifications`
- **Features**:
  - Send to single user
  - Send to multiple users
  - Send to all users
  - Real-time success/failure reporting
  - Admin action logging

## Testing

### Local Testing
1. Build APK locally:
   ```bash
   npm run build --workspace=client
   npx cap sync android
   npx cap open android
   # Run on Android device/emulator
   ```

2. Test in device settings:
   - Allow notifications
   - Check Android system settings → Apps → GreenPay → Notifications

### Testing Notifications
1. Go to admin panel → Push Notifications
2. Select a user and send a test notification
3. Device should receive notification immediately
4. Tap notification to navigate to relevant page

## Troubleshooting

### FCM Token Not Registering
- Check user is authenticated
- Verify `/api/fcm/register-token` is callable
- Check browser console for errors

### Notifications Not Received
1. Verify FCM token exists in database (user table)
2. Check Firebase Console → Cloud Messaging
3. Verify service account has correct permissions
4. Check backend logs for FCM send errors

### Build Fails on GitHub Actions
- Verify `google-services.json` is in `android/app/`
- Check GitHub Secrets are all set correctly
- Review GitHub Actions logs for detailed error

### Service Account Issues
- Ensure full JSON content is in secret (including escaped newlines)
- Verify project ID matches Firebase console
- Check token is still valid (refresh if needed)

## Database Migration

The user table includes a new field:
```sql
fcmToken: text -- Firebase Cloud Messaging token
```

This is automatically managed by the backend when tokens are registered.

## Architecture

```
User Device (Android App)
    ↓
Capacitor PushNotifications Plugin
    ↓
Firebase Cloud Messaging (FCM)
    ↓
Backend Service (fcm.ts)
    ↓
Notification Queue (notification-queue.ts)
    ↓
Database (store FCM token)
    ↓
Backend API Endpoints
    ↓
Admin Panel (admin-notifications.tsx)
```

## Security Notes

- FCM tokens are user-specific and automatically updated
- Backend validates admin authorization before sending notifications
- All notification sends are logged in admin_logs table
- Service account credentials should be kept secure in GitHub Secrets

## Rate Limiting

- FCM allows unlimited messages per device
- Batch sending: up to 500 tokens per request
- Recommended: Don't send more than 1-2 per hour to same user

## Next Steps

1. ✅ Add FCM services and endpoints
2. ✅ Create admin notification panel
3. ✅ Add push notification hook to app
4. ⏳ Set up Firebase console
5. ⏳ Generate service account JSON
6. ⏳ Add GitHub Secrets
7. ⏳ Test on Android device
8. ⏳ Push to Play Store

---

**Firebase Console**: https://console.firebase.google.com/  
**Documentation**: https://firebase.google.com/docs/cloud-messaging  
**Capacitor Plugin**: https://capacitorjs.com/docs/apis/push-notifications
