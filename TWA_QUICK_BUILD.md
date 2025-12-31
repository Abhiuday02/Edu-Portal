# EduPortal TWA - Quick Build Instructions

## ✅ Configuration Updated!

Your TWA project is now configured with your live URL:
- **Server URL:** `https://ietddugu.pythonanywhere.com`
- **Host Name:** `ietddugu.pythonanywhere.com`

## 🚀 Build Your APK Now

### Step 1: Open Android Studio
1. Launch Android Studio
2. Open project: `d:\EduPortal\android_twa`
3. Wait for Gradle sync

### Step 2: Build APK
1. **For Testing:** `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. **For Production:** `Build` → `Generate Signed Bundle / APK` → `APK`

### Step 3: Install & Test
1. Transfer APK to your Android device
2. Enable "Install from unknown sources"
3. Install and test the app

## 📱 What Your App Will Do

✅ **Launch URL:** Opens your EduPortal at `https://ietddugu.pythonanywhere.com`
✅ **Native Feel:** Full-screen experience with splash screen
✅ **Offline Support:** Caches pages for offline viewing
✅ **Push Notifications:** Ready for notification features
✅ **App Icon:** Custom launcher icon

## 🔧 Configuration Details

### Updated Files:
- `strings.xml` - Server URL and host name
- `asset_statements` - Digital asset links for TWA
- All other files remain configured for your app

### App Information:
- **Package Name:** `com.eduportal.twa`
- **App Name:** `EduPortal`
- **Target SDK:** 34
- **Min SDK:** 24 (Android 7.0+)

## ⚡ Quick Commands

If you prefer command line:

```bash
# Navigate to project
cd d:\EduPortal\android_twa

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing)
./gradlew assembleRelease

# Install via ADB
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 🎯 Next Steps

1. **Build APK** using Android Studio
2. **Test on device** to ensure everything works
3. **Create signed APK** for distribution
4. **Optional:** Publish to Play Store

## 🆘 If Issues Occur

**"Connection refused"**
- Check your PythonAnywhere web app is running
- Verify the URL is accessible in mobile browser

**"SSL errors"**
- Your site uses HTTPS (good!)
- TWA handles SSL certificates automatically

**"White screen"**
- Check Android Studio Logcat for errors
- Ensure your web app loads correctly in mobile browser

Your EduPortal TWA is ready to build! 🎉
