#!/usr/bin/env node
/**
 * Generate simple solid-color PNG icons.
 * Creates valid PNG files without external dependencies.
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, "..", "icons");

function createPNG(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = makeChunk("IHDR", Buffer.concat([
    uint32BE(width),
    uint32BE(height),
    Buffer.from([8, 6, 0, 0, 0]), // 8-bit RGBA, deflate, no filter, no interlace
  ]));

  // Pixel data
  const pixels = [];
  for (let y = 0; y < height; y++) {
    pixels.push(0); // filter type: none
    for (let x = 0; x < width; x++) {
      const { r, g, b, a } = getPixel(x, y, width, height);
      pixels.push(r, g, b, a);
    }
  }

  const idat = makeChunk("IDAT", deflateSync(Buffer.from(pixels)));
  const iend = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = uint32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = uint32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function uint32BE(n) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(n >>> 0);
  return buf;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function generateIcon(size) {
  const center = size / 2;
  const radius = size / 2 - 0.5;

  return createPNG(size, size, (x, y) => {
    const dx = x + 0.5 - center;
    const dy = y + 0.5 - center;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > radius) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Gradient: indigo #4f46e5 to #6366f1
    const gradientPos = (x + y) / (size * 2);
    const r = Math.round(79 + (99 - 79) * gradientPos);
    const g = Math.round(70 + (102 - 70) * gradientPos);
    const b = Math.round(229 + (241 - 229) * gradientPos);

    return { r, g, b, a: 255 };
  });
}

// Generate icons
const sizes = [16, 48, 128];
console.log("Generating PNG icons...");

for (const size of sizes) {
  const png = generateIcon(size);
  const path = join(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`✓ Created ${path} (${png.length} bytes)`);
}

console.log("\n✓ All PNG icons generated");
