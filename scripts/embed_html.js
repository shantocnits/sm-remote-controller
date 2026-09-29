const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const versionFilePath = path.join(rootDir, 'version.json');
let version = '1.2.0';
try {
  const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  if (versionData.version) version = versionData.version;
} catch (e) {}

const indexPath = path.join(rootDir, 'desktop-app', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Synchronize currentAppVersion in index.html to match version.json
html = html.replace(/let\s+currentAppVersion\s*=\s*["'][^"']+["'];/, `let currentAppVersion = "${version}";`);
html = html.replace(/<p id="app-header-version"[^>]*>Version [^<]+<\/p>/, `<p id="app-header-version" class="text-[9px] text-textGray mt-0.5 font-mono">Version ${version}</p>`);
html = html.replace(/<p id="app-current-ver-text"[^>]*>v[^<]+<\/p>/, `<p id="app-current-ver-text" class="text-sm font-bold font-mono">v${version}</p>`);

fs.writeFileSync(indexPath, html, 'utf8');

const b64 = Buffer.from(html, 'utf8').toString('base64');
const csPath = path.join(rootDir, 'desktop-app', 'Program.cs');
let cs = fs.readFileSync(csPath, 'utf8');

const regex = /private const string EMBEDDED_HTML_B64 = @"[\s\S]*?";/;
cs = cs.replace(regex, `private const string EMBEDDED_HTML_B64 = @"${b64}";`);

fs.writeFileSync(csPath, cs, 'utf8');
console.log(`Successfully synced v${version} into desktop index.html & Program.cs Base64`);
