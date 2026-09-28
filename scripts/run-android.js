const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Local');

// 1. Detect Java JDK (Prioritize JDK 17)
const javaCandidates = [
  path.join(localAppData, 'Java', 'jdk-17'),
  'C:\\Program Files\\Java\\jdk-17'
];

// Check Eclipse Adoptium folders
const adoptiumBase = 'C:\\Program Files\\Eclipse Adoptium';
if (fs.existsSync(adoptiumBase)) {
  const dirs = fs.readdirSync(adoptiumBase).map(d => path.join(adoptiumBase, d));
  javaCandidates.unshift(...dirs);
}

// Fallback to Android Studio jbr
javaCandidates.push('C:\\Program Files\\Android\\Android Studio\\jbr');

let javaDir = javaCandidates.find(dir => fs.existsSync(path.join(dir, 'bin', 'java.exe')));

// 2. Detect Android SDK
const sdkCandidates = [
  path.join(localAppData, 'Android', 'Sdk'),
  'C:\\Android\\Sdk'
];

let androidSdkDir = sdkCandidates.find(dir => fs.existsSync(path.join(dir, 'platform-tools', 'adb.exe')));

if (!javaDir) {
  console.error('[Error] No valid Java JDK found. Please ensure JDK 17 is installed.');
} else {
  process.env.JAVA_HOME = javaDir;
  console.log(`[Env] Using JAVA_HOME: ${javaDir}`);
}

if (!androidSdkDir) {
  console.error('[Error] No valid Android SDK found. Please ensure Android SDK is installed.');
} else {
  process.env.ANDROID_HOME = androidSdkDir;
  process.env.ANDROID_SDK_ROOT = androidSdkDir;
  console.log(`[Env] Using ANDROID_HOME: ${androidSdkDir}`);

  // Ensure local.properties matches current machine
  const localPropPath = path.join(__dirname, '..', 'android', 'local.properties');
  const escapedSdk = androidSdkDir.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  fs.writeFileSync(localPropPath, `sdk.dir=${escapedSdk}\n`, 'ascii');
}

// 3. Update PATH
const extraPaths = [];
if (javaDir) extraPaths.push(path.join(javaDir, 'bin'));
if (androidSdkDir) {
  extraPaths.push(path.join(androidSdkDir, 'platform-tools'));
  extraPaths.push(path.join(androidSdkDir, 'emulator'));
}

process.env.PATH = `${extraPaths.join(path.delimiter)}${path.delimiter}${process.env.PATH}`;

// Forward arguments directly to react-native run-android
const userArgs = process.argv.slice(2);
const args = ['react-native', 'run-android', ...userArgs];
console.log(`[Runner] Executing: npx ${args.join(' ')}\n`);

const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
