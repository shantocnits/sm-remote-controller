const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-community',
  'cli-server-api',
  'build',
  'index.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (!content.includes('indexPageMiddleware')) {
    content = content.replace(
      'exports.createDevServerMiddleware = createDevServerMiddleware;',
      `exports.createDevServerMiddleware = createDevServerMiddleware;
Object.defineProperty(exports, "indexPageMiddleware", {
  enumerable: true,
  get: function () {
    return _indexPageMiddleware.default;
  }
});`
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[fix-cli] Successfully patched cli-server-api indexPageMiddleware export.');
  }
}
