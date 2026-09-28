const fs = require('fs');

const html = fs.readFileSync('desktop-app/index.html', 'utf8');
const b64 = Buffer.from(html, 'utf8').toString('base64');
let cs = fs.readFileSync('desktop-app/Program.cs', 'utf8');

const regex = /private const string EMBEDDED_HTML_B64 = @"[\s\S]*?";/;
cs = cs.replace(regex, `private const string EMBEDDED_HTML_B64 = @"${b64}";`);

fs.writeFileSync('desktop-app/Program.cs', cs, 'utf8');
console.log('Successfully updated Program.cs with new HTML Base64');
