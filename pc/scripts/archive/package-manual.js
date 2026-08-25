import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const electronDist = join(root, 'node_modules', 'electron', 'dist');
const staging = join(root, '.staging');
const releaseDir = join(root, 'release');
const appDir = join(staging, 'app');

// 打包优化配置：排除不需要的平台以减小体积
// 通过环境变量 PACK_ALL=1 可打包所有平台
const PACK_ALL = process.env.PACK_ALL === '1';
const EXCLUDED_LLAMA_PACKAGES = PACK_ALL ? [] : [
  'win-arm64',          // ARM64 Windows (10 MB) - 大多数用户不需要
  'win-x64-cuda',       // CUDA (139 MB) - 需要 NVIDIA 显卡
  'win-x64-cuda-ext',   // CUDA 扩展 (441 MB) - 需要 NVIDIA 显卡
];

function copyRecursive(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(d, { recursive: true });
      copyRecursive(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

function getSize(dir) {
  let total = 0;
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else total += statSync(p).size;
    }
  }
  walk(dir);
  return (total / 1024 / 1024).toFixed(1);
}

function createZip(sourceDir, outputPath) {
  const escapedSource = sourceDir.replace(/'/g, "''");
  const escapedDest = outputPath.replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${escapedSource}/*' -DestinationPath '${escapedDest}' -Force"`,
    { stdio: 'pipe' },
  );
  const size = (statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`Zip: ${outputPath} (${size} MB)`);
}

async function main() {
  if (existsSync(staging)) rmSync(staging, { recursive: true });
  mkdirSync(appDir, { recursive: true });

  console.log('Copying app code...');
  copyRecursive(dist, join(appDir, 'dist'));
  copyFileSync(join(root, 'electron', 'main.cjs'), join(appDir, 'main.cjs'));
  copyFileSync(join(root, 'electron', 'preload.cjs'), join(appDir, 'preload.cjs'));

  // Copy electron services directory (for sentiment analysis)
  copyRecursive(join(root, 'electron', 'services'), join(appDir, 'services'));

  // Copy build directory (contains app icon)
  if (existsSync(join(root, 'build'))) {
    copyRecursive(join(root, 'build'), join(appDir, 'build'));
  }

  // Copy native modules to app.asar.unpacked (they cannot be loaded from inside asar)
  console.log('Copying native modules to unpacked...');
  const unpackedModulesDir = join(staging, 'app.asar.unpacked', 'node_modules');

  // Copy onnxruntime-node (required for ONNX sentiment model)
  if (existsSync(join(root, 'node_modules', 'onnxruntime-node'))) {
    console.log('Copying onnxruntime-node...');
    copyRecursive(join(root, 'node_modules', 'onnxruntime-node'), join(unpackedModulesDir, 'onnxruntime-node'));
  }
  if (existsSync(join(root, 'node_modules', 'onnxruntime-common'))) {
    copyRecursive(join(root, 'node_modules', 'onnxruntime-common'), join(unpackedModulesDir, 'onnxruntime-common'));
  }

  // Copy node-llama-cpp (required for local LLM inference)
  if (existsSync(join(root, 'node_modules', 'node-llama-cpp'))) {
    console.log('Copying node-llama-cpp...');
    copyRecursive(join(root, 'node_modules', 'node-llama-cpp'), join(unpackedModulesDir, 'node-llama-cpp'));
  }

  // Copy @node-llama-cpp/* native binary packages (required for GPU/CPU inference)
  const llamaScopeDir = join(root, 'node_modules', '@node-llama-cpp');
  if (existsSync(llamaScopeDir)) {
    if (!PACK_ALL) {
      console.log(`Excluding @node-llama-cpp packages: ${EXCLUDED_LLAMA_PACKAGES.join(', ')}`);
    }
    console.log('Copying @node-llama-cpp native binaries...');
    for (const entry of readdirSync(llamaScopeDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (EXCLUDED_LLAMA_PACKAGES.includes(entry.name)) {
          console.log(`  Skipping @node-llama-cpp/${entry.name} (excluded)`);
          continue;
        }
        const srcPkg = join(llamaScopeDir, entry.name);
        const destPkg = join(unpackedModulesDir, '@node-llama-cpp', entry.name);
        console.log(`  Copying @node-llama-cpp/${entry.name}...`);
        copyRecursive(srcPkg, destPkg);
      }
    }
  }

  // Copy GGUF model to unpacked (cannot be loaded from inside asar)
  const modelsUnpackedDir = join(staging, 'app.asar.unpacked', 'models');
  const modelsSrcDir = join(root, '..', 'models');
  mkdirSync(modelsUnpackedDir, { recursive: true });

  const modelFile = 'Qwen3.5-0.8B-IQ4_NL.gguf';
  const modelSrc = join(modelsSrcDir, modelFile);
  if (existsSync(modelSrc)) {
    const sizeMB = Math.round(statSync(modelSrc).size / 1024 / 1024);
    console.log(`Copying ${modelFile} (${sizeMB} MB)...`);
    copyFileSync(modelSrc, join(modelsUnpackedDir, modelFile));
    console.log('Model copied.');
  } else {
    console.log('Model not found:', modelSrc);
  }

  // Copy sentiment ONNX model + vocab to app.asar.unpacked
  const sentimentModelSrc = join(root, 'models', 'sentiment', 'sentiment.onnx');
  const sentimentModelDest = join(modelsUnpackedDir, 'sentiment', 'sentiment.onnx');
  const sentimentVocabSrc = join(root, 'models', 'sentiment', 'vocab.json');
  const sentimentVocabDest = join(modelsUnpackedDir, 'sentiment', 'vocab.json');
  if (existsSync(sentimentModelSrc)) {
    console.log('Copying sentiment ONNX model...');
    mkdirSync(join(modelsUnpackedDir, 'sentiment'), { recursive: true });
    copyFileSync(sentimentModelSrc, sentimentModelDest);
    if (existsSync(sentimentVocabSrc)) {
      copyFileSync(sentimentVocabSrc, sentimentVocabDest);
    }
  } else {
    console.log('Sentiment model not found, skipping...');
  }

  // Copy icon to resources folder (for taskbar icon)
  const iconSrc = join(root, 'build', 'custom-icon.ico');
  const iconDest = join(staging, 'app.asar.unpacked', 'build', 'custom-icon.ico');
  if (existsSync(iconSrc)) {
    console.log('Copying app icon...');
    mkdirSync(join(staging, 'app.asar.unpacked', 'build'), { recursive: true });
    copyFileSync(iconSrc, iconDest);
  }

  const appPkg = { name: 'FriendOS', version: '0.0.4', main: 'main.cjs', description: '全功能个人管理系统', type: 'module' };
  writeFileSync(join(appDir, 'package.json'), JSON.stringify(appPkg, null, 2));

  console.log('Creating app.asar...');
  execSync(`npx asar pack "${appDir}" "${join(staging, 'app.asar')}"`, { cwd: root, stdio: 'pipe' });
  const asarSize = (statSync(join(staging, 'app.asar')).size / 1024 / 1024).toFixed(1);
  console.log(`app.asar size: ${asarSize} MB`);

  const buildVersion = '0.0.4';
  const appReleaseDir = join(releaseDir, 'FriendOS');

  // Clean output folder (for overwriting)
  if (existsSync(appReleaseDir)) {
    try {
      rmSync(appReleaseDir, { recursive: true, force: true });
    } catch (e) {
      console.log('Could not remove old release dir, will overwrite:', e.message);
    }
  }
  mkdirSync(join(appReleaseDir, 'resources'), { recursive: true });

  console.log('Copying Electron runtime...');
  const exclude = ['resources', 'default_app.asar'];
  for (const entry of readdirSync(electronDist, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const s = join(electronDist, entry.name);
    const d = join(appReleaseDir, entry.name === 'electron.exe' ? 'FriendOS.exe' : entry.name);
    if (entry.isDirectory()) {
      mkdirSync(d, { recursive: true });
      copyRecursive(s, d);
    } else {
      copyFileSync(s, d);
    }
  }

  copyFileSync(join(staging, 'app.asar'), join(appReleaseDir, 'resources', 'app.asar'));
  // Copy unpacked models directory alongside asar
  copyRecursive(join(staging, 'app.asar.unpacked'), join(appReleaseDir, 'resources', 'app.asar.unpacked'));
  rmSync(staging, { recursive: true });

  const totalSize = getSize(appReleaseDir);
  console.log(`\nPackaged to: ${appReleaseDir}`);
  console.log(`Total: ${totalSize} MB`);
  console.log(`Executable: ${join(appReleaseDir, 'FriendOS.exe')}`);

  // Create portable zip
  console.log('\nCreating portable zip...');
  const zipPath = join(releaseDir, 'FriendOS.zip');
  if (existsSync(zipPath)) rmSync(zipPath, { force: true });
  createZip(appReleaseDir, zipPath);

  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
