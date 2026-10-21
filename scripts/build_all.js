const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 [Build All] Starting complete build process...');

const rootDir = path.resolve(__dirname, '..');
const versionFilePath = path.join(rootDir, 'version.json');
const apkOutputDir = path.join(rootDir, 'apk');

if (!fs.existsSync(apkOutputDir)) {
  fs.mkdirSync(apkOutputDir, { recursive: true });
}

// 1. Read Version
let versionData = { version: '1.2.0' };
try {
  versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
} catch (e) {
  console.warn('Could not read version.json, defaulting to 1.2.0');
}
const version = versionData.version || '1.4.0';
console.log(`📌 Current Version: v${version}`);

// 2. Bundle React Native JS Bundle
console.log('\n📦 Step 0: Bundling React Native JavaScript & Assets for Android...');
try {
  const assetsDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  const bundleCmd = 'npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res';
  execSync(bundleCmd, { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ React Native Android bundle created successfully!');
} catch (e) {
  console.warn('⚠️ Warning: react-native bundle command failed:', e.message);
}

// 2. Prepare Android APK
console.log('\n📱 Step 1: Preparing Android APK for apk folder...');
const debugApkSource = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const releaseApkSource = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const apkTarget = path.join(apkOutputDir, 'SM_Remote_Controller.apk');
const apkVersionTarget = path.join(apkOutputDir, `SM_Remote_Controller_v${version}.apk`);

if (fs.existsSync(releaseApkSource)) {
  console.log('📦 Found official release APK from Gradle.');
  fs.copyFileSync(releaseApkSource, apkTarget);
  fs.copyFileSync(releaseApkSource, apkVersionTarget);
  console.log('✅ Clean production Release APK copied to apk folder!');
} else if (fs.existsSync(debugApkSource)) {
  console.log('⚠️ Release APK not found, using debug APK as fallback...');
  fs.copyFileSync(debugApkSource, apkTarget);
  try {
    require('./update_apk_bundle.js');
  } catch (e) {
    console.warn('Could not inject bundle:', e.message);
  }
  fs.copyFileSync(apkTarget, apkVersionTarget);
}

  // Strict cleanup: ONLY main APK and current versioned APK remain in apk/ folder
  const allowedFiles = new Set(['SM_Remote_Controller.apk', `SM_Remote_Controller_v${version}.apk`]);
  const existingFiles = fs.readdirSync(apkOutputDir);
  for (const file of existingFiles) {
    if (!allowedFiles.has(file)) {
      try {
        fs.unlinkSync(path.join(apkOutputDir, file));
      } catch (err) {}
    }
  }

  console.log(`✅ Android APK ready in apk folder (clean 2 files only):`);
  console.log(`   - ${apkTarget}`);
  console.log(`   - ${apkVersionTarget}`);

console.log('\n🎉 [Build All Completed] All latest files are ready in the "apk/" folder!\n');
