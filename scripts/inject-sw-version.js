const fs = require('fs');
const path = require('path');

const buildId = fs.readFileSync(path.join(__dirname, '../.next/BUILD_ID'), 'utf8').trim();
const swPath = path.join(__dirname, '../public/sw.js');
const sw = fs.readFileSync(swPath, 'utf8');
const updated = sw.replace(/CACHE_VERSION = '[^']*'/, `CACHE_VERSION = '${buildId}'`);
fs.writeFileSync(swPath, updated);
console.log(`sw.js: CACHE_VERSION set to ${buildId}`);
