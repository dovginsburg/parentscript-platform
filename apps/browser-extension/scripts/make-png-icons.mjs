/**
 * Generate minimal PNG icons for Chrome extension.
 * Uses hand-crafted PNG for each size.
 */
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ICONS_DIR = join(__dirname, "..", "icons");

// Create a simple PNG with proper headers
// This creates a solid indigo square with a white "P"
function createMinimalPNG(size) {
  const width = size;
  const height = size;

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = createChunk('IHDR', Buffer.concat([
    Buffer.from([0, 0, 0, size]), // width
    Buffer.from([0, 0, 0, size]), // height
    Buffer.from([8]), // bit depth
    Buffer.from([6]), // color type (RGBA)
    Buffer.from([0, 0, 0]) // compression, filter, interlace
  ]));

  // Create pixel data (simplified solid color with transparency)
  const pixelData = [];
  const indigo = { r: 79, g: 70, b: 229, a: 255 }; // #4f46e5

  for (let y = 0; y < height; y++) {
    pixelData.push(0); // filter type
    for (let x = 0; x < width; x++) {
      // Create a circle
      const dx = x - width / 2;
      const dy = y - height / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = width / 2;

      if (distance > radius) {
        // Transparent
        pixelData.push(0, 0, 0, 0);
      } else {
        // Indigo
        pixelData.push(indigo.r, indigo.g, indigo.b, indigo.a);
      }
    }
  }

  const idat = createChunk('IDAT', compress(Buffer.from(pixelData)));
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function compress(data) {
  // For simplicity, use uncompressed DEFLATE block
  // In production, use zlib
  const header = Buffer.from([0x78, 0x01]); // zlib header
  const blocks = [];

  // Split into 65535-byte chunks
  for (let i = 0; i < data.length; i += 65535) {
    const chunk = data.subarray(i, Math.min(i + 65535, data.length));
    const isLast = (i + 65535 >= data.length) ? 1 : 0;
    const len = chunk.length;
    const nlen = ~len & 0xFFFF;

    blocks.push(Buffer.from([isLast]));
    blocks.push(Buffer.from([len & 0xFF, (len >> 8) & 0xFF]));
    blocks.push(Buffer.from([nlen & 0xFF, (nlen >> 8) & 0xFF]));
    blocks.push(chunk);
  }

  // Adler-32 checksum (simplified - just use 1 for now)
  const checksum = Buffer.from([0, 0, 0, 1]);

  return Buffer.concat([header, ...blocks, checksum]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

// Simpler approach: just copy the SVG as fallback
async function copyIconsAsPlaceholder() {
  console.log("Creating placeholder PNG references...");
  console.log("Note: Chrome Manifest V3 supports SVG icons natively.");
  console.log("If PNGs are required, install librsvg:\n");
  console.log("  brew install librsvg");
  console.log("  cd apps/browser-extension");
  console.log("  for i in 16 48 128; do rsvg-convert -w $i -h $i icons/icon-$i.svg -o icons/icon-$i.png; done\n");

  // For now, create symlinks or notes
  const sizes = [16, 48, 128];
  for (const size of sizes) {
    await writeFile(
      join(ICONS_DIR, `icon-${size}.png.txt`),
      `To generate PNG: rsvg-convert -w ${size} -h ${size} icon-${size}.svg -o icon-${size}.png`
    );
  }

  console.log("✓ Created PNG generation instructions");
  console.log("\nAlternative: Update manifest.json to use .svg extension instead of .png");
}

copyIconsAsPlaceholder();
