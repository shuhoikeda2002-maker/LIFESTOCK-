# Life Stock Mobile App Build Instructions

This project is configured with **Capacitor** to run as a native mobile application on iOS and Android.

## Prerequisites
- Node.js and npm installed.
- **For iOS:** macOS with the latest version of Xcode installed.
- **For Android:** Android Studio installed with the latest SDKs.

## Initial Setup
If you are running this for the first time on your local machine:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Build the Web Project:**
   ```bash
   npm run build
   ```

3. **Initialize Capacitor Platforms:**
   ```bash
   npx cap add ios
   npx cap add android
   ```

## Building for iOS
1. **Sync the latest build:**
   ```bash
   npm run build
   ```
2. **Update Capacitor:**
   ```bash
   npx cap sync
   ```
3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```
4. In Xcode, select your target device/simulator and click the **Run** button.

## Building for Android
1. **Sync the latest build:**
   ```bash
   npm run build
   ```
2. **Update Capacitor:**
   ```bash
   npx cap sync
   ```
3. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```
4. In Android Studio, wait for Gradle to sync, then select your target device/emulator and click the **Run** button.

## Orientation and UI
- The app is locked to **Landscape** orientation via the `@capacitor/screen-orientation` plugin.
- The UI is optimized for a **812 x 375 px** landscape view, which is the standard size for modern mobile browsers in landscape (e.g., iPhone X/11/12/13/14).
- The "fixed" container ensures the game layout remains consistent across different device aspect ratios.

## Troubleshooting
- **Sync Issues:** If files are not updating in the native project, ensure you run `npm run build` followed by `npx cap sync`.
- **Permissions:** If the app requires specific permissions (like camera or gallery, though not used here), update `Info.plist` (iOS) or `AndroidManifest.xml` (Android) accordingly.
