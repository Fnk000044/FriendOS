const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'build', 'icon.svg');
const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');

async function generateIco() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate PNG buffers for different sizes
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push(pngBuffer);
    console.log(`Generated ${size}x${size}`);
  }

  // For Windows ICO, we need to create a proper ICO file
  // ICO format: header + entries + image data
  const headerSize = 6;
  const entrySize = 16;
  const header = Buffer.alloc(headerSize);

  // ICO header
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Type: ICO
  header.writeUInt16LE(sizes.length, 4); // Number of images

  const entries = [];
  let imageDataOffset = headerSize + (entrySize * sizes.length);

  // Create entries for each size
  for (let i = 0; i < sizes.length; i++) {
    const entry = Buffer.alloc(entrySize);
    const size = sizes[i];
    const pngBuffer = pngBuffers[i];

    entry.writeUInt8(size === 256 ? 0 : size, 0);  // Width
    entry.writeUInt8(size === 256 ? 0 : size, 1);  // Height
    entry.writeUInt8(0, 2);      // Color palette
    entry.writeUInt8(0, 3);      // Reserved
    entry.writeUInt16LE(1, 4);   // Color planes
    entry.writeUInt16LE(32, 6);  // Bits per pixel
    entry.writeUInt32LE(pngBuffer.length, 8);  // Image data size
    entry.writeUInt32LE(imageDataOffset, 12);  // Image data offset

    entries.push({ entry, data: pngBuffer });
    imageDataOffset += pngBuffer.length;
  }

  // Combine all parts
  const parts = [header];
  for (const { entry, data } of entries) {
    parts.push(entry);
  }
  for (const { data } of entries) {
    parts.push(data);
  }

  const icoBuffer = Buffer.concat(parts);
  fs.writeFileSync(icoPath, icoBuffer);

  console.log(`ICO file saved to: ${icoPath}`);
  console.log(`File size: ${(icoBuffer.length / 1024).toFixed(1)} KB`);
}

generateIco().catch(console.error);
