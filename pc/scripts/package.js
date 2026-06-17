import { packager } from '@electron/packager';
import { createWriteStream } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'release');
const electronDist = join(root, 'node_modules', 'electron', 'dist');

async function main() {
  console.log('Packaging FriendOS with @electron/packager...');

  const appPaths = await packager({
    dir: root,
    name: 'FriendOS',
    platform: 'win32',
    arch: 'x64',
    out: outDir,
    overwrite: true,
    asar: true,
    prune: true,
    electronDist: electronDist,
    ignore: [
      /\.ts$/,
      /\.tsconfig/,
      /node_modules\/\.cache/,
      /node_modules\/electron/,
      /src\//,
      /scripts\//,
      /参考图\//,
      /\.git/,
      /postcss\.config\.js/,
      /tailwind\.config\.js/,
      /tsconfig\.json/,
    ],
    win32metadata: {
      ProductName: 'FriendOS',
      InternalName: 'FriendOS',
      FileDescription: '全功能个人管理系统',
    },
  });

  const appPath = appPaths[0];
  console.log('Packaged to:', appPath);

  const zipPath = join(root, 'release', 'FriendOS-便携版.zip');
  console.log('Creating portable zip...');

  const archiver = require('archiver');
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(appPath, 'FriendOS');
    archive.finalize();
  });

  const mb = (archive.pointer() / 1024 / 1024).toFixed(1);
  console.log(`Portable zip: ${zipPath} (${mb} MB)`);
  console.log('Done!');
}

main().catch(console.error);
