const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('⚡ [Live Push] মোবাইল APK আপডেট ও সরাসরি ফোনে ইনস্টল শুরু হচ্ছে...\n');

const rootDir = path.resolve(__dirname, '..');
const updateScript = path.join(rootDir, 'scripts', 'update_apk_bundle.js');
const apkFile = path.join(rootDir, 'apk', 'SM_Remote_Controller.apk');

// 1. Update bundle in APK
try {
  console.log('📦 ধাপ ১: কোড বান্ডল করে APK-তে ইনজেক্ট করা হচ্ছে...');
  execSync(`node "${updateScript}"`, { stdio: 'inherit' });
} catch (e) {
  console.error('❌ বান্ডল আপডেটে ত্রুটি:', e.message);
  process.exit(1);
}

// 2. Install to connected phone via ADB
try {
  console.log('\n📱 ধাপ ২: কানেক্টেড ফোনে নতুন APK ইনস্টল করা হচ্ছে (পূর্বের ডেটা অক্ষুণ্ণ রেখে)...');
  const adbOut = execSync('adb devices', { encoding: 'utf8' });
  const lines = adbOut.trim().split('\n').slice(1).filter(l => l.trim().length > 0);

  if (lines.length === 0) {
    console.log('⚠️ USB-তে কোনো ফোন কানেক্ট করা পাওয়া যায়নি।');
    console.log(`👉 তবে APK তৈরি হয়ে গেছে: ${apkFile}`);
    console.log('ফোন পিসিতে কানেক্ট করে আবার এই কমান্ড দিন, অথবা ফাইলটি ফোনে নিয়ে ইনস্টল দিন।');
  } else {
    execSync(`adb install -r "${apkFile}"`, { stdio: 'inherit' });
    console.log('\n🎉 [Success] আপনার ফোনে লেটেস্ট APK সফলভাবে ইনস্টল ও আপডেট হয়ে গেছে!');
    console.log('এখন ফোনে অ্যাপটি ওপেন করলেই নতুন পরিবর্তন দেখতে পাবেন।');
  }
} catch (e) {
  console.error('❌ ফোনে ইনস্টলে ত্রুটি:', e.message);
}
