/**
 * Build Installer Script
 * Creates an NSIS installer for FriendOS
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

console.log('=== FriendOS Installer Builder ===\n');

// Step 1: Build the frontend
console.log('[1/3] Building frontend...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ Frontend build complete\n');
} catch (err) {
  console.error('✗ Frontend build failed:', err.message);
  process.exit(1);
}

// Step 2: Build the Electron app with NSIS installer
console.log('[2/3] Building Electron app and installer...');
try {
  execSync('npx electron-builder --win --config electron-builder.json', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('✓ Electron build complete\n');
} catch (err) {
  console.error('✗ Electron build failed:', err.message);
  process.exit(1);
}

// Step 3: Report output
console.log('[3/3] Build complete!\n');
console.log('Output files:');
const releaseDir = path.join(rootDir, 'release');
if (fs.existsSync(releaseDir)) {
  const files = fs.readdirSync(releaseDir);
  files.forEach(file => {
    const filePath = path.join(releaseDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  - ${file} (${sizeMB} MB)`);
    }
  });
}

console.log('\n=== Done ===');
