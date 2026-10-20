const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const userProfile = process.env.USERPROFILE || 'C:\\Users\\Khandaker Shanto';
const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk'),
  'C:\\Users\\Khandaker Shanto\\AppData\\Local\\Android\\Sdk',
  'C:\\Users\\CNIT PC 01\\AppData\\Local\\Android\\Sdk',
].filter(Boolean);

let sdkDir = sdkCandidates.find((dir) => fs.existsSync(dir)) || path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk');
const buildToolsDir = path.join(sdkDir, 'build-tools');
let toolVer = '34.0.0';
if (fs.existsSync(buildToolsDir)) {
  const vers = fs.readdirSync(buildToolsDir).filter((v) => fs.existsSync(path.join(buildToolsDir, v, 'aapt.exe')));
  if (vers.length > 0) toolVer = vers[vers.length - 1];
}

const aaptPath = path.join(buildToolsDir, toolVer, 'aapt.exe');
const apksignerPath = path.join(buildToolsDir, toolVer, 'apksigner.bat');
const debugKeystore = path.join(rootDir, 'android', 'app', 'debug.keystore');

const versionJsonPath = path.join(rootDir, 'version.json');
let version = '1.4.0';
try {
  const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  if (versionData.version) version = versionData.version;
} catch (e) {}

const bundleSource = path.join(rootDir, 'android', 'app', 'src', 'main', 'assets', 'index.android.bundle');
const targetApk = path.join(rootDir, 'apk', 'SM_Remote_Controller.apk');
const targetVersionApk = path.join(rootDir, 'apk', `SM_Remote_Controller_v${version}.apk`);

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
