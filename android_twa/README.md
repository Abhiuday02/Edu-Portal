# EduPortal TWA APK Build Instructions

## Prerequisites
1. **Android Studio** (latest version)
2. **Java 8+** (JDK)
3. **Android SDK** (API 24+)

## Setup Instructions

### 1. Open Project in Android Studio
- Open Android Studio
- Select "Open an existing project"
- Navigate to `d:\EduPortal\android_twa`
- Wait for Gradle sync to complete

### 2. Configure Web Server URL
**Important:** Update the server URL before building:

1. Open `app/src/main/res/values/strings.xml`
2. Change these lines to your actual server URL:
```xml
<string name="launch_url">http://YOUR_SERVER_IP:5000</string>
<string name="host_name">YOUR_SERVER_IP</string>
```

For local testing:
```xml
<string name="launch_url">http://192.168.1.100:5000</string>
<string name="host_name">192.168.1.100</string>
```

### 3. Build APK

#### Option A: Debug APK (for testing)
1. In Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. APK will be in: `android_twa/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Release APK (for distribution)
1. `Build` → `Generate Signed Bundle / APK`
2. Select `APK`
3. Create new keystore or use existing
4. Follow the signing wizard
5. APK will be in: `android_twa/app/build/outputs/apk/release/app-release.apk`

### 4. Install APK
- Transfer APK to Android device
- Enable "Install from unknown sources" in settings
- Install the APK

## Features Enabled

✅ **Trusted Web Activity** - Native app experience
✅ **Offline Support** - Service Worker caching
✅ **Push Notifications** - Via Service Worker
✅ **Native Splash Screen** - Professional launch
✅ **Full Screen Mode** - No browser UI
✅ **App Icon** - Custom launcher icon

## Server Requirements

Your Flask app needs:
1. **HTTPS** (for production) or HTTP for testing
2. **Service Worker** for offline caching
3. **Web App Manifest** for PWA features

## Testing

1. Start your Flask server: `python app.py`
2. Make sure it's accessible from your device (same WiFi network)
3. Install and test the APK

## Troubleshooting

- **"Net::ERR_CLEARTEXT_NOT_PERMITTED"**: Add your domain to `network_security_config.xml`
- **"App won't install"**: Enable "Unknown Sources" in Android settings
- **"White screen"**: Check server URL and network connectivity

## Next Steps

1. Add your server IP to the configuration
2. Test with debug APK first
3. Create release APK for distribution
4. Consider publishing to Google Play Store

Need help with any step?
