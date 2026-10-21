# 📱 SM Remote Controller — সম্পূর্ণ মোবাইল প্রজেক্ট গাইড ও রিলিজ নির্দেশিকা

এই ডকুমেন্টটি নতুন মোবাইল রিলিজ তৈরি, স্বয়ংক্রিয় APK বিল্ড প্রসেস, ইন-অ্যাপ অটো-আপডেট (OTA) পরিচালনা এবং গিটহাব রিলিজ করার পূর্ণাঙ্গ গাইডলাইন।

---

## 📑 সূচিপত্র
1. [📁 apk ফোল্ডারে ফাইল ব্যবস্থাপনা (মাত্র ২টি ফাইল থাকবে)](#1--apk-ফোল্ডারে-ফাইল-ব্যবস্থাপনা-মাত্র-২টি-ফাইল-থাকবে)
2. [⚡ ১-ক্লিকে ফুল APK বিল্ড করার নিয়ম](#2--১-ক্লিকে-ফুল-apk-বিল্ড-করার-নিয়ম)
3. [GitHub-এ নতুন রিলিজ ও আপডেট পাবলিশ করার সহজ ধাপ](#3-github-এ-নতুন-রিলিজ-ও-আপডেট-পাবলিশ-করার-সহজ-ধাপ)
4. [ইন-অ্যাপ অটো-আপডেট ও রেড ডট কীভাবে কাজ করে](#4-ইন-অ্যাপ-অটো-আপডেট-ও-রেড-ডট-কীভাবে-কাজ-করে)
5. [🚨 সবচেয়ে গুরুত্বপূর্ণ: রিপোজিটরি Public রাখা](#5--সবচেয়ে-গুরুত্বপূর্ণ-রিপোজিটরি-public-রাখা)
6. [জরুরি টিপস ও ট্রাবলশুটিং](#6-জরুরি-টিপস-ও-ট্রাবলশুটিং)
7. [🤖 ভবিষ্যতের জন্য রেডিমেড AI Prompts (Copy & Paste)](#7--ভবিষ্যতের-জন্য-রেডিমেড-ai-prompts-copy--paste)

---

## 1. 📁 apk ফোল্ডারে ফাইল ব্যবস্থাপনা (মাত্র ২টি ফাইল থাকবে)

`apk/` ফোল্ডারে অতিরিক্ত কোনো ফাইল থাকবে না। এতে সবসময় শুধুমাত্র ২টি ফাইল থাকবে:

📍 **পাথ:** `apk/`
- 📱 **`SM_Remote_Controller.apk`** — ⭐ **প্রধান প্রোডাকশন APK (প্রতিবার GitHub Release-এ এই ফাইলটিই আপলোড করতে হবে!)**।
- 📱 **`SM_Remote_Controller_v1.5.6.apk`** — আপনার লোকাল পিসিতে বর্তমান ভার্সনটির ব্যাকআপ কপি।

> 💡 **নোট:** আপনি যখনই `node scripts/build_all.js` বা `npm run build:all` চালাবেন, স্ক্রিপ্টটি স্বয়ংক্রিয়ভাবে পুরনো ভার্সন ক্লিন করে শুধুমাত্র এই দুটি ফাইল রাখবে।

---

## 2. ⚡ ১-ক্লিকে ফুল APK বিল্ড করার নিয়ম

প্রজেক্টের রুট ডিরেক্টরি থেকে নিচের কমান্ডটি চালালেই ফ্রেশ জাভাস্ক্রিপ্ট বান্ডেল তৈরি হয়ে APK ক্রিপ্টোগ্রাফিকালি সাইন (v2 & v3 schemes) হয়ে `apk/` ফোল্ডারে চলে যাবে:

```powershell
npm run build:all
```
*(অথবা: `node scripts/build_all.js`)*

📍 **বিল্ড হওয়া প্রধান APK লোকেশন:**  
`apk/SM_Remote_Controller.apk`

---

## 3. 🎯 GitHub-এ নতুন রিলিজ ও আপডেট পাবলিশ করার গোল্ডেন রুলস

> ⚠️ **গোল্ডেন রুল ১: ভার্সন নাম্বার সব সময় বাড়াতে হবে (কখনই আগের বা একই ভার্সন রাখা যাবে না!)**  
> আগের ভার্সন যদি হয় `1.5.5`, তবে পরবর্তী ভার্সন অবশ্যই `1.5.6` করতে হবে এবং `versionCode` ১১ থেকে বাড়িয়ে ১২ করতে হবে। একই ভার্সন রাখলে অ্যাপ ভাববে সে অলরেডি আপ-টু-ডেট আছে, তাই আপডেট নোটিফিকেশন আসবে না!
>
> ⚠️ **গোল্ডেন রুল ২: GitHub Release-এ সবসময় `SM_Remote_Controller.apk` ফাইলটি আপলোড করতে হবে!**  
> ভার্সন নাম্বার ওয়ালা ফাইলটি (`SM_Remote_Controller_v1.5.6.apk`) শুধুই আপনার পিসির ব্যাকআপ। অ্যাপের ভেতর যখন ব্যবহারকারী "Update Now" চাপবে, অ্যাপটি GitHub থেকে নির্দিষ্ট নাম `SM_Remote_Controller.apk` ডাউনলোড করতে যায়। তাই GitHub-এ সবসময় ফিক্সড নামের `SM_Remote_Controller.apk` ফাইলটিই আপলোড করবেন।

### ধাপ ১: `version.json` ও `build.gradle` ফাইল আপডেট
[version.json](file:///d:/Panel/My-app/sm-remote-controller/version.json) ফাইলে ভার্সন নাম্বার ১ ধাপ বাড়িয়ে ও চেঞ্জলগ সেট করুন:
```json
{
  "version": "1.5.6",
  "versionCode": 12,
  "releaseDate": "2026-10-21",
  "minAppVersion": "1.0.0",
  "downloadUrl": "https://github.com/shantocnits/sm-remote-controller/releases/download/v1.5.6/SM_Remote_Controller.apk",
  "changelog": [
    "🚀 Android 14 MediaProjection callback fix — Screen sharing now works on ALL Android devices",
    "🛡️ Double-buffered frame rendering eliminates 100% of screen flickering / blinking",
    "👆 High-precision remote Touch, Tap, and Swipe/Scroll gestures (AnyDesk style)",
    "⚡ Full edge-to-edge remote display with zero gaps and uncluttered clean UI",
    "🎛️ Ultra-compact docked control bar positioned neatly below the shared screen",
    "🔗 Synchronized disconnect: Stopping session terminates on both phones simultaneously"
  ]
}
```
এবং [android/app/build.gradle](file:///d:/Panel/My-app/sm-remote-controller/android/app/build.gradle)-এ:
```groovy
versionCode 12
versionName "1.5.6"
```

### ধাপ ②: ফ্রেশ APK বিল্ড করা
```powershell
npm run build:all
```
*(এই কমান্ডটি স্বয়ংক্রিয়ভাবে `SM_Remote_Controller.apk` তৈরি করবে এবং `SM_Remote_Controller_v1.5.6.apk` ব্যাকআপ রেখে পুরনোটি মুছে দেবে)*

### ধাপ ৩: গিট কমিট ও পুশ করা
```powershell
git add .
git commit -m "release: bump version to v1.5.6"
git push origin main
```

### ধাপ ৪: GitHub Release তৈরি ও APK আপলোড (খুব সহজ)
1. GitHub রিপোজিটরির **Releases** পেইজে যান:  
   👉 `https://github.com/shantocnits/sm-remote-controller/releases`
2. **"Draft a new release"** বাটনে ক্লিক করুন।
3. **Choose a tag:** লিখুন `v1.5.6` (এবং Create new tag সিলেক্ট করুন)।
4. **Release title:** দিন `SM Remote Controller v1.5.6`
5. **Attach binaries:** আপনার প্রজেক্টের `apk/` ফোল্ডার থেকে শুধুমাত্র **`SM_Remote_Controller.apk`** ফাইলটি ড্র্যাগ অ্যান্ড ড্রপ করে আপলোড করুন।
6. **"Publish release"** বাটনে ক্লিক করুন।

---

## 4. 📲 অ্যাপ ইনস্টল ও আপডেট নেওয়ার নিয়ম: আগের অ্যাপ কি আনইনস্টল করতে হবে?

> 💡 **না, আগের অ্যাপ আনইনস্টল করার কোনো প্রয়োজন নেই!**  
> যেহেতু প্রজেক্টের সাইনিং কি (KeyStore) এবং প্যাকেজ নেইম (`com.helloworld`) একই রয়েছে, তাই:
> 1. আপনার ফোনে আগের অ্যাপ থাকা অবস্থাতেই নতুন APK ডাউনলোড করে ইনস্টল দিলে ফোনের আগের ডেটা না হারিয়ে সরাসরি **"Update"** হয়ে যাবে।
> 2. অথবা অ্যাপের ভেতরের লাল ডট / আপডেট বাটনে চাপ দিয়ে **"Update Now"** দিলে APK ডাউনলোড হবে। ডাউনলোড শেষে নোটিফিকেশন বার থেকে ট্যাপ করে **"Update"** দিলেই নতুন ভার্সনে কনভার্ট হয়ে যাবে।
> 3. আপডেট সম্পন্ন হলে অ্যাপে আর **রেড ডট দেখাবে না**, যতক্ষণ না ভবিষ্যতে আপনি আরেকটি নতুন ভার্সন রিলিজ করবেন।

> 💡 **মোবাইল টু মোবাইল টাচ রেসপন্স:**  
> স্ক্রিনের যেকোনো জায়গায় টাচ করলে সরাসরি লাইভ কোঅর্ডিনেট সহ টাচ রিপল ইফেক্ট দেখা যাবে এবং রিমোট ফোনে ইনপুট চলে যাবে।

---

## 7. 🤖 ভবিষ্যতের জন্য রেডিমেড AI Prompts (Copy & Paste)

ভবিষ্যতে নতুন ভার্সন রিলিজের জন্য AI কে সরাসরি নিচের প্রম্পটটি দিতে পারেন:

```text
আমি নতুন ভার্সন রিলিজ করতে চাই। 
1. version.json ফাইলটি আপডেট করে ভার্সন ১ ধাপ বাড়াও, আজকের তারিখ ও চেঞ্জলগ সেট করো।
2. নতুন ফ্রেশ বান্ডেল তৈরি করে APK বিল্ড ও সাইন করো।
3. apk/ ফোল্ডারে যেন অতিরিক্ত ফাইল না থাকে, শুধুমাত্র SM_Remote_Controller.apk এবং নতুন ভার্সনড APK রাখো।
4. পরিবর্তনগুলো Git commit ও push করে দাও।
5. আমাকে জানিয়ে দাও GitHub Release-এ কোন Tag Name ও Title দিতে হবে।
```
