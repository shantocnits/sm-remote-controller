const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\CNIT PC 01\\.gemini\\antigravity-ide\\brain\\4663a96f-6c9a-40cc-ab56-5e6a239f984e\\remote_controller_logo_1790590547949.jpg';
const destDirs = [
  'android/app/src/main/res/mipmap-mdpi',
  'android/app/src/main/res/mipmap-hdpi',
  'android/app/src/main/res/mipmap-xhdpi',
  'android/app/src/main/res/mipmap-xxhdpi',
  'android/app/src/main/res/mipmap-xxxhdpi',
];

if (fs.existsSync(srcPath)) {
  const buf = fs.readFileSync(srcPath);
  destDirs.forEach((d) => {
    const fullDir = path.join(__dirname, '..', d);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    fs.writeFileSync(path.join(fullDir, 'ic_launcher.png'), buf);
    fs.writeFileSync(path.join(fullDir, 'ic_launcher_round.png'), buf);
  });
  console.log('Successfully placed app icons in all mipmap directories!');
} else {
  console.error('Source icon image not found:', srcPath);
}
