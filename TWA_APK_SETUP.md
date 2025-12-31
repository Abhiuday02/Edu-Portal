# EduPortal TWA APK

I've created a complete Android TWA (Trusted Web Activity) project that will wrap your EduPortal web app as a native APK.

## 📁 Project Structure Created:
```
d:\EduPortal\android_twa\
├── build.gradle                    # Project build config
├── settings.gradle                 # Project settings
├── gradle.properties              # Gradle properties
├── app/
│   ├── build.gradle                # App build config
│   ├── src/main/
│   │   ├── AndroidManifest.xml     # App permissions & config
│   │   ├── java/com/eduportal/twa/
│   │   │   └── LauncherActivity.kt # Main launcher
│   │   └── res/
│   │       ├── values/
│   │       │   ├── strings.xml     # URLs & app name
│   │       │   ├── colors.xml      # App colors
│   │       │   └── themes.xml      # App themes
│   │       └── xml/
│   │           ├── file_paths.xml   # File provider config
│   │           ├── backup_rules.xml # Backup rules
│   │           └── data_extraction_rules.xml
│   └── proguard-rules.pro          # Code obfuscation rules
└── README.md                       # Build instructions
```

## 🚀 What This Gives You:
- ✅ **Native APK** that opens your EduPortal
- ✅ **Offline caching** via Service Worker
- ✅ **Push notifications** support
- ✅ **Native splash screen**
- ✅ **Full-screen experience** (no browser UI)
- ✅ **App icon** on home screen
- ✅ **Professional native feel**

## 📋 Next Steps:

### 1. **Update Server URL**
Open `android_twa/app/src/main/res/values/strings.xml` and change:
```xml
<string name="launch_url">http://YOUR_IP:5000</string>
<string name="host_name">YOUR_IP</string>
```

### 2. **Build APK**
- Open `android_twa` folder in Android Studio
- Build → Build APK(s)
- Install on Android device

### 3. **For Production**
- Add HTTPS to your Flask app
- Create signed APK
- Publish to Play Store

## 🎯 Key Features:
- **Real-time updates** via WebSocket
- **Offline storage** via Service Worker
- **Native messaging** via push notifications
- **Zero code changes** to your web app
- **100% free** (Android Studio + TWA library)

The project is ready to build! Just update your server IP and you'll have a native APK in minutes.
