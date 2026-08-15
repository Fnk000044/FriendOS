const asar = require('@electron/asar');
const fs = require('fs');
const path = 'release-portable/win-unpacked/resources/app.asar';
const buf = fs.readFileSync(path);
const header = asar.extractFile(path, 'header');
console.log('asar size MB:', (fs.statSync(path).size / 1024 / 1024).toFixed(0));
console.log('header keys:', header ? Object.keys(header).slice(0, 10) : 'null');
