const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

console.log('📱 [SM Remote Controller] লাইভ টেস্টিং সেটআপ শুরু হচ্ছে...\n');

// 1. Get Local IPv4 Address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIp();

// 2. Check ADB devices
let adbConnected = false;
try {
  const adbOut = execSync('adb devices', { encoding: 'utf8' });
  const lines = adbOut.trim().split('\n').slice(1);
  const devices = lines.filter(l => l.trim().length > 0 && !l.includes('offline'));
  
  if (devices.length > 0) {
    adbConnected = true;
    console.log(`✅ USB-তে কানেক্টেড ডিভাইস পাওয়া গেছে: ${devices.length} টি`);
    
    // Reverse port 8081 for seamless USB live testing
    try {
      execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'ignore' });
      console.log('⚡ adb reverse tcp:8081 tcp:8081 সফলভাবে সেট করা হয়েছে!');
    } catch (e) {}
  } else {
    console.log('ℹ️ USB দিয়ে কোনো ডিভাইস কানেক্ট করা নেই। আপনি একই Wi-Fi দিয়েও লাইভ টেস্ট করতে পারবেন।');
  }
} catch (e) {
  console.log('ℹ️ adb কমান্ড পাওয়া যায়নি বা ডিভাইস কানেক্টেড নেই।');
}

console.log('\n======================================================');
console.log('🚀 লাইভ টেস্টিং নির্দেশিকা (Live Reload Instructions):');
console.log('======================================================');
if (adbConnected) {
  console.log('🔹 USB মোড: ফোন কানেক্টেড আছে! অ্যাপ ওপেন করলে স্বয়ংক্রিয়ভাবে কোড লাইভ লোড হবে।');
} else {
  console.log('🔹 Wi-Fi মোড:');
  console.log(`   ১. পিসি এবং মোবাইল একই Wi-Fi তে কানেক্ট রাখুন।`);
  console.log(`   ২. ফোনে অ্যাপ ওপেন করে ফোন ঝাঁকিয়ে (Shake) Developer Menu আনুন।`);
  console.log(`   ৩. Settings -> "Debug server host & port for device" এ গিয়ে লিখুন:`);
  console.log(`      👉 ${localIp}:8081`);
  console.log(`   ৪. এরপর অ্যাপ Reload দিলেই লাইভ কোড পরিবর্তন দেখতে পাবেন!`);
}
console.log('======================================================\n');
console.log('📡 Metro লাইভ বান্ডলার সার্ভার চালু করা হচ্ছে (Ctrl+C দিয়ে বন্ধ করতে পারবেন)...\n');

// 3. Start Metro bundler
const metro = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['react-native', 'start'], {
  stdio: 'inherit'
});

metro.on('close', (code) => {
  process.exit(code);
});
