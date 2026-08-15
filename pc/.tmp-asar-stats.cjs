const asar = require('@electron/asar');
const files = asar.listPackage('release-portable/win-unpacked/resources/app.asar');
console.log('total files:', files.length);
const sizeMap = {};
for (const f of files) {
  const parts = f.split(/[\\/]+/).filter(Boolean);
  let top;
  if (parts[0] === 'node_modules') top = 'nm/' + (parts[1] || '?');
  else if (parts[0]) top = parts[0];
  else top = '(root)';
  sizeMap[top] = (sizeMap[top] || 0) + 1;
}
Object.entries(sizeMap).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(v, k));
