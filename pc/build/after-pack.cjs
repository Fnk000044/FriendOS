/**
 * electron-builder afterPack 钩子
 *
 * 在打包 win-unpacked/ 之后、生成 NSIS 安装包之前裁剪产物，
 * 把不需要的跨平台/跨架构二进制和语言包删掉，缩小最终包体。
 *
 * 删除清单：
 *   1) onnxruntime-node 的 darwin/linux/win32-arm64 原生二进制
 *      （目标架构 win x64，多余的 ~190MB）
 *   2) locales/ 下除 zh-CN.pak、en-US.pak 外的所有 .pak（~46MB）
 *   3) LICENSES.chromium.html（20MB，Chromium 法律展示页，不影响运行）
 *   4) 顶层 dxcompiler.dll（25MB，DX12 着色器编译器，CPU EP 不需要）
 *
 * 注意：dxcompiler.dll 删除后若 onnxruntime 启动报错，
 * 把对应条目注释掉即可回滚（多占 25MB）。
 */

const fs = require('fs');
const path = require('path');

const KEEP_LOCALES = new Set(['zh-CN.pak', 'en-US.pak']);

function rmrf(p) {
  if (!fs.existsSync(p)) return 0;
  const stat = fs.statSync(p);
  const size = stat.isDirectory()
    ? totalSizeDir(p)
    : stat.size;
<<<<<<< HEAD
  try {
    fs.rmSync(p, { recursive: true, force: true });
    return size;
  } catch (e) {
    // 裁剪为"尽力优化"：删除失败（如沙箱 safe-delete 拦截）只警告，不中断打包
    console.warn(`  [after-pack] 跳过删除 ${p}: ${e.message}`);
    return 0;
  }
=======
  fs.rmSync(p, { recursive: true, force: true });
  return size;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
}

function totalSizeDir(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += totalSizeDir(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

function fmtSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

module.exports = async function (context) {
  const appDir = context.appOutDir;
  let saved = 0;

  // ── 1) onnxruntime-node 多余平台二进制 ──────────────────────
  // 路径: resources/app.asar.unpacked/node_modules/onnxruntime-node/bin/napi-v6/
  const napiV6 = path.join(
    appDir, 'resources', 'app.asar.unpacked', 'node_modules',
    'onnxruntime-node', 'bin', 'napi-v6'
  );
  if (fs.existsSync(napiV6)) {
    // 只保留 win32/x64，删 darwin/linux/win32-arm64
    for (const sub of ['darwin', 'linux']) {
      const p = path.join(napiV6, sub);
      const s = rmrf(p);
      if (s) { saved += s; console.log(`  [after-pack] removed ${sub}: ${fmtSize(s)}`); }
    }
    const win32Dir = path.join(napiV6, 'win32');
    if (fs.existsSync(win32Dir)) {
      for (const arch of ['arm64']) {
        const p = path.join(win32Dir, arch);
        const s = rmrf(p);
        if (s) { saved += s; console.log(`  [after-pack] removed win32/${arch}: ${fmtSize(s)}`); }
      }
    }
  }

  // ── 2) locales 语言包 ──────────────────────────────────────
  const localesDir = path.join(appDir, 'locales');
  if (fs.existsSync(localesDir)) {
    for (const entry of fs.readdirSync(localesDir)) {
      if (!entry.endsWith('.pak')) continue;
      if (KEEP_LOCALES.has(entry)) continue;
      const p = path.join(localesDir, entry);
      const s = rmrf(p);
      if (s) saved += s;
    }
    const kept = fs.readdirSync(localesDir).filter(f => f.endsWith('.pak'));
    console.log(`  [after-pack] locales kept: ${kept.join(', ')}`);
  }

  // ── 3) Chromium LICENSES.html ────────────────────────────────
  const licenses = path.join(appDir, 'LICENSES.chromium.html');
  const s3 = rmrf(licenses);
  if (s3) { saved += s3; console.log(`  [after-pack] removed LICENSES.chromium.html: ${fmtSize(s3)}`); }

  // ── 4) dxcompiler.dll ───────────────────────────────────────
  // DX12 着色器编译器，onnxruntime CPU EP 不依赖它。
  // 注意：win-unpacked/ 顶层和 onnxruntime-node/bin/napi-v6/win32/x64/
  // 下都各有一份 dxcompiler.dll，都删。若运行报错再恢复。
  const targets = [
    path.join(appDir, 'dxcompiler.dll'),
    path.join(napiV6, 'win32', 'x64', 'dxcompiler.dll'),
  ];
  for (const p of targets) {
    const s = rmrf(p);
    if (s) { saved += s; console.log(`  [after-pack] removed ${path.basename(p)}: ${fmtSize(s)}`); }
  }

<<<<<<< HEAD
  // ── 5) exe 资源注入（图标 + 版本信息）───────────────────────
  // 背景：electron-builder 的 rcedit 由 Go 版 app-builder.exe 执行，
  // 该二进制会自行下载 winCodeSign 2.6.0 的 7z 并在解压时创建符号链接，
  // 在无符号链接特权的环境下必失败；因此 electron-builder.json 已将
  // signAndEditExecutable 置为 false，改由本地 rcedit-x64.exe 在
  // afterPack 阶段（打包后、生成安装器前）手动注入，效果等价。
  const rceditPath = path.join(__dirname, '..', 'scripts', 'tools', 'rcedit-x64.exe');
  const iconPath = path.join(__dirname, 'custom-icon.ico');
  const exePath = path.join(appDir, `${context.packager.appInfo.productFilename}.exe`);
  if (fs.existsSync(rceditPath) && fs.existsSync(iconPath) && fs.existsSync(exePath)) {
    try {
      const { execFileSync } = require('child_process');
      const version = context.packager.appInfo.version;
      execFileSync(rceditPath, [
        exePath,
        '--set-icon', iconPath,
        '--set-version-string', 'ProductName', 'FriendOS',
        '--set-version-string', 'CompanyName', 'FriendOS Team',
        '--set-version-string', 'FileDescription', 'FriendOS 知己 — 本地优先的心理健康伴侣',
        '--set-version-string', 'LegalCopyright', 'Copyright (c) 2026 FriendOS Team',
        '--set-file-version', `${version}.0`,
        '--set-product-version', `${version}.0`,
      ], { stdio: 'ignore', timeout: 60000 });
      console.log('  [after-pack] exe 图标/版本信息注入完成（本地 rcedit）');
    } catch (e) {
      console.warn(`  [after-pack] rcedit 注入失败（不阻断打包）: ${e.message}`);
    }
  } else {
    console.warn('  [after-pack] 跳过 rcedit：rcedit/图标/目标 exe 缺失');
  }

=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  console.log(`[after-pack] total saved: ${fmtSize(saved)}`);
};
