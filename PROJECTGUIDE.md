# 📱 SM Remote Controller — Project & Release Guide 🚀

এই গাইডে **Mobile APK** ও **Desktop EXE** বিল্ড করা, আপডেট রিলিজ করা এবং ইন-অ্যাপ অটো-আপডেট কীভাবে কাজ করে তার সম্পূর্ণ গাইড দেওয়া হয়েছে।

---

## 📌 সূচিপত্র (Table of Contents)
1. [প্রজেক্ট আর্কিটেকচার ও ফিচারসমূহ](#1-প্রজেক্ট-আর্কিটেকচার-ও-ফিচারসমূহ)
2. [নতুন Mobile APK তৈরি করার নিয়ম](#2-নতুন-mobile-apk-তৈরি-করার-নিয়ম)
3. [নতুন Desktop EXE তৈরি করার নিয়ম](#3-নতুন-desktop-exe-তৈরি-করার-নিয়ম)
4. [GitHub-এ নতুন রিলিজ ও আপডেট পাবলিশ করার ধাপসমূহ](#4-github-এ-নতুন-রিলিজ-ও-আপডেট-পাবলিশ-করার-ধাপসমূহ)
5. [ইন-অ্যাপ অটো-আপডেট সিস্টেম কীভাবে কাজ করে](#5-ইন-অ্যাপ-অটো-আপডেট-সিস্টেম-কীভাবে-কাজ-করে)
6. [জরুরি টিপস ও ট্রাবলশুটিং](#6-জরুরি-টিপস-ও-ট্রাবলশুটিং)

---

## 1. প্রজেক্ট আর্কিটেকচার ও ফিচারসমূহ
- **মোবাইল অ্যাপ:** React Native (Android)
- **ডেস্কটপ কন্ট্রোলার:** C# .NET Windows Forms Webview (`SM_Remote_Controller.exe`) + HTML5 Dashboard
- **আপডেট ব্যাকএন্ড:** GitHub Releases + `version.json`
- **ফিচারসমূহ:**
  - রিয়েলটাইম লাইভ ক্যামেরা স্ট্রিমিং ও স্ক্রিনশট
  - স্ক্রিন রেকর্ডিং (MP4 এক্সপোর্ট)
  - রিয়েলটাইম মাইক্রোফোন মিউট/আনমিউট
  - ভার্চুয়াল কিবোর্ড ও পিসি শর্টকাট কি
  - অটো-আপডেট সিস্টেম (ইন-অ্যাপ ডাউনলোড ও ইনস্টল)
  - ডার্ক থিম ও রেসপন্সিভ ড্যাশবোর্ড

---

## 2. নতুন Mobile APK তৈরি করার নিয়ম

নতুন কোনো কোড পরিবর্তন বা ফিচার যুক্ত করার পর নতুন APK বিল্ড করতে নিচের কমান্ডগুলো চালান:

### অপশন ক: Release APK (Recommended for Users)
```powershell
cd android
./gradlew assembleRelease
cd ..
```
📍 **বিল্ড হওয়া APK লোকেশন:**  
`android/app/build/outputs/apk/release/app-release.apk`

### অপশন খ: Debug APK (For Testing)
```powershell
cd android
./gradlew assembleDebug
cd ..
```
📍 **বিল্ড হওয়া APK লোকেশন:**  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 3. নতুন Desktop EXE তৈরি করার নিয়ম

ডেস্কটপ অ্যাপের ডিজাইন বা কোডে কোনো পরিবর্তন করলে নিচের দুটি কমান্ড ক্রমানুসারে চালান:

### ধাপ ১: HTML কোড C# ফাইলে এম্বেড করা
```powershell
node scripts/embed_html.js
```

### ধাপ ২: C# কম্পাইলার দিয়ে EXE বিল্ড করা
```powershell
& "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" /target:winexe /out:"SM_Remote_Controller.exe" /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll /r:System.Runtime.InteropServices.dll /win32icon:"desktop-app\app_icon.ico" desktop-app\Program.cs
```
📍 **বিল্ড হওয়া EXE লোকেশন:**  
প্রজেক্টের রুট ডিরেক্টরিতে `SM_Remote_Controller.exe` তৈরি হবে।

---

## 4. GitHub-এ নতুন রিলিজ ও আপডেট পাবলিশ করার ধাপসমূহ

যখন আপনি নতুন ভার্সন রিলিজ করতে চান (যেমন `1.2.0` থেকে `1.3.0`):

### ধাপ ১: `version.json` ফাইল আপডেট করা
প্রজেক্টের রুটে থাকা [version.json](file:///d:/Panel/My-app/sm-remote-controller/version.json) ফাইলে ভার্সন ও চেঞ্জলগ আপডেট করুন:
```json
{
  "version": "1.3.0",
  "versionCode": 4,
  "releaseDate": "2026-10-01",
  "minAppVersion": "1.0.0",
  "downloadUrl": "https://github.com/shantocnits/sm-remote-controller/releases/download/v1.3.0/SM_Remote_Controller.apk",
  "exeUrl": "https://github.com/shantocnits/sm-remote-controller/releases/download/v1.3.0/SM_Remote_Controller.exe",
  "changelog": [
    "🚀 নতুন ফিচার যুক্ত করা হয়েছে",
    "📸 স্ক্রিনশট এবং ক্যামেরা ফিক্স",
    "⚡ দ্রুত কানেকশন ও পারফরম্যান্স উন্নয়ন"
  ]
}
```

### ধাপ ২: গিট পুশ করা
```powershell
git add .
git commit -m "release: bump version to v1.3.0"
git push origin main
```

### ধাপ ৩: GitHub Release তৈরি ও ফাইল আপলোড
1. আপনার GitHub রিপোজিটরির **Releases** সেকশনে যান:  
   👉 `https://github.com/shantocnits/sm-remote-controller/releases`
2. **Draft a new release** বাটনে ক্লিক করুন।
3. **Tag version:** দিন `v1.3.0`
4. **Release title:** দিন `SM Remote Controller v1.3.0`
5. নিচের দুটি ফাইল ড্র্যাগ অ্যান্ড ড্রপ করে আপলোড করুন:
   - `SM_Remote_Controller.apk` (মোবাইল APK)
   - `SM_Remote_Controller.exe` (ডেস্কটপ EXE)
6. **Publish release** বাটনে ক্লিক করুন।

---

## 5. ইন-অ্যাপ অটো-আপডেট সিস্টেম কীভাবে কাজ করে

### 📱 মোবাইল APK-তে:
1. ইউজার যখন অ্যাপে ঢোকে বা আপডেট বাটনে ট্যাপ করে, অ্যাপ স্বয়ংক্রিয়ভাবে গিটহাবের `version.json` চেক করে।
2. নতুন ভার্সন পাওয়া গেলে **"Update Now"** বাটন ভেসে ওঠে।
3. ইউজার ট্যাপ করলে সরাসরি গিটহাব রিলিজ থেকে নতুন APK ডাউনলোড শুরু হয়।
4. ডাউনলোড শেষে অ্যান্ড্রয়েড পপআপে দেখায়: **"Do you want to update this app?"**
5. ইউজার **"Update"** চাপলেই অ্যাপ আগের ডাটা না হারিয়ে সাথে সাথে নতুন ভার্সনে আপডেট হয়ে যায়।

### 🖥️ ডেস্কটপ অ্যাপে:
1. ডেস্কটপ অ্যাপ ওপেন করার সাথে সাথে উপরে আপডেট নোটিফিকেশন বার চেক করে।
2. নতুন ভার্সন আসলে **"Update Now (v1.3.0)"** বাটন চলে আসে।
3. ক্লিক করলে স্বয়ংক্রিয়ভাবে নতুন EXE ডাউনলোড লিঙ্কে নিয়ে যায়।

---

## 6. জরুরি টিপস ও ট্রাবলশুটিং

> 💡 **কখনোই আগের APK আনইনস্টল করার প্রয়োজন নেই:**  
> অ্যান্ড্রয়েডে একই প্যাকেজ নামের নতুন APK সরাসরি ইনস্টল দিলে তা পূর্বের ডেটা না মুছেই আপডেট (Overwrite) হয়।

> 💡 **ডেস্কটপ টাস্কবার আইকন:**  
> ডেস্কটপ অ্যাপে `desktop-app/app_icon.ico` আইকনটি সরাসরি উইন্ডোজ টাইটেলবার ও টাস্কবারে প্রদর্শিত হয়।
