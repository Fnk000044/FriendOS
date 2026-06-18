---
name: electron-build
description: Build, package, and test the FriendOS Electron desktop app with consistent steps and error handling.
---

# Electron Build & Package Skill

Standardized workflow for building, packaging, and testing the FriendOS Electron desktop application.

## When to use

Use this skill when the user asks to:
- Build or rebuild the Electron app
- Package the app for distribution
- Fix build/packaging errors
- Test the packaged app
- Copy model files to the packaged app

## Prerequisites

- Node.js installed and available in PATH
- `npm` available in PATH
- Working directory: `E:\FriendOS\pc`

## Standard workflow

### 1. Build the frontend

```bash
cd E:/FriendOS/pc && npm run build 2>&1
```

**Expected output**: TypeScript compilation + Vite build completes without errors.

**If build fails**:
- Check TypeScript errors: `cd E:/FriendOS/pc && npx tsc --noEmit 2>&1`
- Fix type errors before proceeding

### 2. Package the Electron app

Use the custom packaging script (not `electron-builder`):

```bash
cd E:/FriendOS/pc && node scripts/package-manual.js 2>&1
```

**Or use the combined command**:

```bash
cd E:/FriendOS/pc && npm run pack 2>&1
```

**Expected output**: Creates release in `E:/FriendOS/pc/release/FriendOS/`

**If packaging fails**:
- Check if `app.asar` exists in `release/FriendOS/resources/`
- Ensure no stale processes: `taskkill /F /IM FriendOS.exe` (if running)

### 3. Copy model files (if local AI models are used)

After packaging, copy the `models` directory to the unpacked app resources:

```bash
mkdir -p "E:/FriendOS/pc/release/FriendOS/resources/app.asar.unpacked/models"
cp "E:/FriendOS/pc/release/FriendOS-0.0.2/resources/app.asar.unpacked/models/"* "E:/FriendOS/pc/release/FriendOS/resources/app.asar.unpacked/models/" 2>/dev/null || echo "No model files to copy"
```

### 4. Verify the package

Check that the release directory exists and has expected structure:

```bash
ls -la "E:/FriendOS/pc/release/FriendOS/resources/"
```

### 5. Test (optional)

Run the packaged app:

```bash
"E:/FriendOS/pc/release/FriendOS/FriendOS.exe"
```

## Key files

| File | Purpose |
|------|---------|
| `pc/scripts/package-manual.js` | Custom Electron packaging script |
| `pc/package.json` | Project dependencies and scripts |
| `pc/electron/services/LocalModelService.cjs` | Local AI model management |
| `pc/electron/services/ModelRegistry.cjs` | Model registry |
| `pc/release/FriendOS/` | Packaged app output |

## Common issues

1. **"Module not found" errors**: Run `npm install` in `E:/FriendOS/pc` first
2. **Stale release directory**: Delete `E:/FriendOS/pc/release/` before re-packaging
3. **Model files missing**: Check `E:/FriendOS/models/` for downloaded models
4. **app.asar too large**: Check what's being included in the package
5. **Electron process stuck**: `taskkill /F /IM FriendOS.exe`

## Variations

- **Dev mode** (no packaging): `cd E:/FriendOS/pc && npm run dev`
- **Type-check only**: `cd E:/FriendOS/pc && npx tsc --noEmit 2>&1`
- **Clean build**: Delete `node_modules/.vite` cache, then rebuild
