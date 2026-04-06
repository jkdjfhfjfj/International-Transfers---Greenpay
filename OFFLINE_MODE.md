# GreenPay Offline Mode ✅

## Overview

GreenPay supports complete offline functionality to ensure users can continue using the app even without internet connection. This is essential for Play Store approval.

## What Works Offline

✅ **Fully Functional Offline**:
- View account balance
- Browse transaction history
- Check virtual card details
- Read announcements
- Access settings
- View help & FAQs
- Navigate all cached pages

⚠️ **Limited Offline** (needs sync when online):
- Create new transactions
- Update profile
- Request withdrawals
- Pay bills
- Send messages

## How It Works

### 1. Service Worker Caching

**File**: `client/public/sw.js`

**Strategy**:
```
API Requests (GET)
├─ Network first
├─ Cache fallback if offline
└─ Store successful responses

Static Assets (JS/CSS)
├─ Network first
├─ Cache fallback
└─ Always fresh code

HTML Pages
├─ Network first
├─ Cache fallback
└─ Offline page if no cache

Images & Fonts
├─ Cache first
├─ Network fallback
└─ Serve from cache
```

### 2. Automatic Caching

All API responses are automatically cached:
```typescript
// User makes request
GET /api/dashboard
  ↓
// Service worker intercepts
Network → Success? → Cache it → Return response
             ↓
           Offline? → Return from cache
             ↓
           No cache? → Show offline indicator
```

### 3. Local Storage

Additional offline data storage:
```typescript
import { useLocalStorage, cacheApiResponse } from '@/hooks/use-offline';

// Store user preferences
const [darkMode, setDarkMode] = useLocalStorage('dark-mode', false);

// Cache API responses
await cacheApiResponse('/api/user-profile', userData);

// Retrieve from cache
const cached = getCachedApiResponse('/api/user-profile');
```

### 4. Offline Indicator

**Component**: `client/src/components/offline-indicator.tsx`

Shows users when:
- Internet connection is lost (orange bar with WiFi off icon)
- Connection is restored (green bar with WiFi icon)
- Offline features are available

### 5. Offline Page

**File**: `client/public/offline.html`

When user tries to access a page with no cached data:
- Clean, friendly interface
- Shows available offline features
- Button to retry connection
- Button to browse cached content

## Features Using Offline Mode

### Dashboard
- ✅ View balance (cached)
- ✅ View recent transactions (cached)
- ✅ View card details (cached)
- ❌ Add funds (needs internet)

### Transactions
- ✅ View transaction list (cached)
- ✅ View transaction details (cached)
- ❌ Send money (needs internet)
- ❌ Request payment (needs internet)

### Virtual Cards
- ✅ View card list (cached)
- ✅ View card details (cached)
- ✅ View card transactions (cached)
- ❌ Freeze/unfreeze card (needs internet)
- ❌ Reissue card (needs internet)

### Settings
- ✅ View settings (cached)
- ✅ Toggle dark mode (local storage)
- ✅ View profile (cached)
- ❌ Update profile (needs internet)
- ❌ Change password (needs internet)

## Implementation Details

### Service Worker

```javascript
// Network first for API
fetch(request)
  .then(response => {
    // Cache successful responses
    cache.put(request, response.clone());
    return response;
  })
  .catch(() => {
    // Offline - return from cache
    return cache.match(request) || offlineResponse;
  });
```

### Local Storage Structure

```typescript
// API cache entries
localStorage['api-cache:/api/dashboard'] = {
  data: { balance, transactions, ... },
  timestamp: 1712425600000
}

// User preferences
localStorage['dark-mode'] = 'true'
localStorage['language'] = 'en'
```

### Cache Size Limits

- **Service Worker Cache**: Browser default (~500MB on Android)
- **LocalStorage**: Browser default (~5-10MB)
- **Automatic Cleanup**: Old caches deleted on service worker activation

## API Responses for Offline

When offline and no cache available:

```json
{
  "offline": true,
  "cached": false,
  "message": "No cached data available. Please check your connection."
}
```

App should show:
- Loading spinner while checking cache
- "No data available" message if cache is empty
- Cached data with disclaimer if available

## Testing Offline Mode

### Chrome DevTools (Web)

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Navigate pages
5. Should still work with cached data

### Android Device

1. Enable Airplane mode
2. Open app
3. Navigate pages
4. Should show cached data
5. Disable Airplane mode
6. Data syncs automatically

### Service Worker Debug

```javascript
// Check registered service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// View cached data
caches.open('greenpay-v4').then(cache => {
  cache.keys().then(requests => {
    console.log('Cached requests:', requests);
  });
});
```

## Google Play Requirements

✅ **Handled**:
- App remains usable when offline
- Shows offline indicator to user
- Caches essential data automatically
- Gracefully handles missing data
- Allows retry when online
- No permission popup spam
- Complies with Play Store policies

## User Experience

### Scenario 1: User Goes Offline

```
User browsing dashboard
  ↓
User loses internet (or goes offline)
  ↓
App shows orange "You're offline" banner
  ↓
User continues using app with cached data
  ↓
Pages still load
  ↓
User performs read-only operations (view balance, etc.)
  ↓
User tries to send money → Shows "needs internet" message
```

### Scenario 2: User Comes Back Online

```
User has "You're offline" banner shown
  ↓
Internet connection restored
  ↓
App detects online event
  ↓
Shows green "Back online" banner briefly
  ↓
Data automatically syncs
  ↓
Fresh data loads
```

### Scenario 3: First Visit After Install

```
User installs app
  ↓
Opens GreenPay
  ↓
Service worker installs
  ↓
Caches essential files
  ↓
Loads app normally with internet
  ↓
All subsequent requests cached
```

## Cache Management

### Manual Cache Clear

```typescript
import { clearAllCache } from '@/hooks/use-offline';

// Clear all cached data
clearAllCache();
```

### Cache Size Check

```typescript
import { getCacheSize } from '@/hooks/use-offline';

const sizeInBytes = await getCacheSize();
console.log(`Cache size: ${sizeInBytes / 1024 / 1024}MB`);
```

### Auto-Cleanup

- Old caches automatically deleted
- Service worker updates trigger cache refresh
- Stale data (> 24h) can be manually cleared

## Configuration

### Service Worker Cache Names

Edit `client/public/sw.js`:
```javascript
const CACHE_NAME = 'greenpay-v4';      // Main cache
const API_CACHE = 'greenpay-api-v4';   // API responses
```

### Offline Page

Edit `client/public/offline.html`:
- Customize offline message
- Change available offline features list
- Modify styling

### Cache Strategy

Modify fetch handler in `sw.js`:
- Change network/cache priority
- Adjust timeout values
- Add new cache rules

## Troubleshooting

### Service Worker Not Registering

```javascript
// Check console for errors
navigator.serviceWorker.getRegistrations().catch(err => {
  console.error('SW registration failed:', err);
});
```

### Cached Data Not Updating

```typescript
// Clear cache manually
clearAllCache();

// Or in service worker
caches.delete('greenpay-v4');
```

### Offline Page Showing Instead of App

- Ensure `/offline.html` exists
- Check service worker in Chrome DevTools
- Clear browser cache
- Try incognito mode

### Cache Not Growing

- Check browser storage quota
- Review service worker errors
- Ensure fetch requests are successful

## Performance Impact

✅ **Positive Impact**:
- Faster page loads (cached assets)
- Reduced network usage
- Works without internet
- Better user experience
- Meets Play Store requirements

⚠️ **Considerations**:
- Initial load installs service worker (~100-200ms)
- First load still requires network
- Cache storage uses device space
- Old caches need cleanup

## Future Enhancements

- 📱 Sync pending actions when online
- 📊 Smart cache (keep frequently used data)
- 🔄 Background sync for pending transactions
- 📍 Offline analytics tracking
- 🔐 End-to-end encryption for cached data

## Offline Mode by Environment

### Development
```bash
# Test offline in browser
Chrome DevTools → Network → Offline checkbox

# Or simulate offline
navigator.onLine = false  // In console
```

### Android Emulator
```bash
# Toggle airplane mode
adb shell settings put global airplane_mode_on 1  # Enable
adb shell settings put global airplane_mode_on 0  # Disable
```

### Production
- Automatic on Play Store
- No configuration needed
- Users experience naturally

## Monitoring

### Logs to Check

```bash
# Service worker registration
console.log('SW registered');

# Cache operations
console.log('Cache put:', url);
console.log('Cache match:', url);

# Offline/online events
console.log('App offline');
console.log('App online');
```

### Analytics to Track

- % of offline uses
- Offline duration
- Features used offline
- Cache hit ratio
- Performance impact

## References

- **MDN Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **PWA Guidelines**: https://web.dev/progressive-web-apps/
- **Google Play Offline**: https://support.google.com/googleplay/android-developer
- **Cache Strategy**: https://web.dev/offline-fallbacks-for-navigation/

---

**Status**: ✅ PRODUCTION READY  
**Last Updated**: 2026-04-06  
**Coverage**: Web + Android App
