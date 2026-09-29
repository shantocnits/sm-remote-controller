const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const aaptPath = 'C:\\Users\\CNIT PC 01\\AppData\\Local\\Android\\Sdk\\build-tools\\34.0.0\\aapt.exe';
const apksignerPath = 'C:\\Users\\CNIT PC 01\\AppData\\Local\\Android\\Sdk\\build-tools\\34.0.0\\apksigner.bat';
const debugKeystore = path.join(rootDir, 'android', 'app', 'debug.keystore');

const bundleSource = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'index.android.bundle');
const targetApk = path.join(rootDir, 'apk', 'SM_Remote_Controller.apk');
const targetVersionApk = path.join(rootDir, 'apk', 'SM_Remote_Controller_v1.3.0.apk');

if (!fs.existsSync(bundleSource)) {
  console.error('❌ Bundle source not found:', bundleSource);
  process.exit(1);
}

console.log('📦 Updating APK with latest index.android.bundle...');

// Create temp directory structure with assets/index.android.bundle
const tempDir = path.join(rootDir, 'temp_apk_update');
const tempAssets = path.join(tempDir, 'assets');
if (!fs.existsSync(tempAssets)) {
  fs.mkdirSync(tempAssets, { recursive: true });
}

fs.copyFileSync(bundleSource, path.join(tempAssets, 'index.android.bundle'));

try {
  // Remove existing bundle inside target APK
  try {
    execSync(`"${aaptPath}" r "${targetApk}" assets/index.android.bundle`, { stdio: 'ignore' });
  } catch (e) {}

  // Add the newly compiled bundle inside target APK
  execSync(`"${aaptPath}" a "${targetApk}" assets/index.android.bundle`, { cwd: tempDir, stdio: 'inherit' });
  console.log('✅ assets/index.android.bundle successfully injected into SM_Remote_Controller.apk!');

  // Cryptographically Sign the APK with v2/v3 signatures
  if (fs.existsSync(apksignerPath) && fs.existsSync(debugKeystore)) {
    execSync(`"${apksignerPath}" sign --ks "${debugKeystore}" --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android "${targetApk}"`, { stdio: 'inherit' });
    console.log('🔏 APK signed successfully with apksigner (v2 & v3 schemes)!');
  }

  // Copy to versioned target
  fs.copyFileSync(targetApk, targetVersionApk);
  console.log('📋 Copied to:', targetVersionApk);
} catch (err) {
  console.error('❌ Error updating APK:', err.message);
} finally {
  // Cleanup temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}
}
