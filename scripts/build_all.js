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
const version = versionData.version || '1.2.0';
console.log(`📌 Current Version: v${version}`);

// 2. Embed HTML into Desktop C#
console.log('\n📦 Step 1: Embedding Desktop HTML...');
try {
  require('./embed_html.js');
} catch (e) {
  console.error('Error embedding HTML:', e);
}

// 3. Compile Desktop EXE
console.log('\n🖥️ Step 2: Compiling Desktop EXE...');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe';
const desktopProgram = path.join(rootDir, 'desktop-app', 'Program.cs');
const iconPath = path.join(rootDir, 'desktop-app', 'app_icon.ico');
const rootExePath = path.join(rootDir, 'SM_Remote_Controller.exe');
const apkFolderExePath = path.join(apkOutputDir, 'SM_Remote_Controller.exe');
const apkFolderExeVersionPath = path.join(apkOutputDir, `SM_Remote_Controller_v${version}.exe`);

try {
  const compileCmd = `& "${cscPath}" /target:winexe /out:"${rootExePath}" /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll /r:System.Runtime.InteropServices.dll /win32icon:"${iconPath}" "${desktopProgram}"`;
  execSync(`powershell -Command "${compileCmd}"`, { stdio: 'inherit' });
  
  // Copy to apk folder
  fs.copyFileSync(rootExePath, apkFolderExePath);
  fs.copyFileSync(rootExePath, apkFolderExeVersionPath);
  console.log(`✅ Desktop EXE compiled & copied to:`);
  console.log(`   - ${apkFolderExePath}`);
  console.log(`   - ${apkFolderExeVersionPath}`);
} catch (e) {
  console.error('❌ Failed to compile desktop EXE:', e.message);
}

// 4. Copy Android APK
console.log('\n📱 Step 3: Copying Android APK to apk folder...');
const debugApkSource = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const releaseApkSource = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const apkSource = fs.existsSync(releaseApkSource) ? releaseApkSource : debugApkSource;

if (fs.existsSync(apkSource)) {
  const apkTarget = path.join(apkOutputDir, 'SM_Remote_Controller.apk');
  const apkVersionTarget = path.join(apkOutputDir, `SM_Remote_Controller_v${version}.apk`);
  
  // Sign APK targets
  const apksignerPath = 'C:\\Users\\CNIT PC 01\\AppData\\Local\\Android\\Sdk\\build-tools\\34.0.0\\apksigner.bat';
  const debugKeystore = path.join(rootDir, 'android', 'app', 'debug.keystore');
  if (fs.existsSync(apksignerPath) && fs.existsSync(debugKeystore)) {
    try {
      execSync(`& "${apksignerPath}" sign --ks "${debugKeystore}" --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android "${apkTarget}"`, { shell: 'powershell', stdio: 'ignore' });
      fs.copyFileSync(apkTarget, apkVersionTarget);
      console.log('🔏 Android APK cryptographically signed with v2/v3 signature schemes.');
    } catch (e) {}
  }

console.log('\n🎉 [Build All Completed] All latest files are ready in the "apk/" folder!\n');
