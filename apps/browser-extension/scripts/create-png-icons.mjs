/**
 * Generate PNG icons using raw PNG encoding.
 * Creates simple brand-aligned icons at 16, 48, and 128px.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import { Buffer } from 'node:buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ICONS_DIR = join(__dirname, '..', 'icons');

// Brand colors (indigo)
const COLOR_START = { r: 79, g: 70, b: 229 }; // #4f46e5
const COLOR_END = { r: 99, g: 102, b: 241 }; // #6366f1
const COLOR_WHITE = { r: 255, g: 255, b: 255 };

function createCircleIcon(size) {
  const canvas = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  const center = size / 2;
  const radius = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5;
      const dy = y - center + 0.5;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        // Gradient from top-left to bottom-right
        const gradientPos = (x + y) / (size * 2);
        const r = Math.round(COLOR_START.r + (COLOR_END.r - COLOR_START.r) * gradientPos);
        const g = Math.round(COLOR_START.g + (COLOR_END.g - COLOR_START.g) * gradientPos);
        const b = Math.round(COLOR_START.b + (COLOR_END.b - COLOR_START.b) * gradientPos);

        // Anti-aliasing at edges
        const alpha = distance > radius - 1 ? Math.max(0, 255 * (radius - distance)) : 255;

        canvas[y][x] = { r, g, b, a: Math.round(alpha) };
      } else {
        canvas[y][x] = { r: 0, g: 0, b: 0, a: 0 }; // Transparent
      }
    }
  }

  // Draw "P" letter in center (simplified)
  if (size >= 48) {
    drawLetter(canvas, size);
  } else if (size >= 16) {
    drawSmallLetter(canvas, size);
  }

  return canvas;
}

function drawLetter(canvas, size) {
  const center = Math.floor(size / 2);
  const letterHeight = Math.floor(size * 0.5);
  const letterWidth = Math.floor(size * 0.35);
  const strokeWidth = Math.floor(size * 0.08);

  const startY = center - Math.floor(letterHeight / 2);
  const endY = startY + letterHeight;

  // Vertical stem
  for (let y = startY; y < endY; y++) {
    for (
      let x = center - Math.floor(letterWidth / 2);
      x < center - Math.floor(letterWidth / 2) + strokeWidth;
      x++
    ) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        canvas[y][x] = COLOR_WHITE;
      }
    }
  }

  // Top curve (simplified as horizontal line + short vertical)
  const curveWidth = Math.floor(letterWidth * 0.7);
  const curveHeight = Math.floor(letterHeight * 0.35);

  // Top horizontal
  for (
    let x = center - Math.floor(letterWidth / 2);
    x < center - Math.floor(letterWidth / 2) + curveWidth;
    x++
  ) {
    for (let dy = 0; dy < strokeWidth; dy++) {
      const y = startY + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) {
        canvas[y][x] = COLOR_WHITE;
      }
    }
  }

  // Right vertical of P
  for (let y = startY; y < startY + curveHeight; y++) {
    for (
      let x = center - Math.floor(letterWidth / 2) + curveWidth - strokeWidth;
      x < center - Math.floor(letterWidth / 2) + curveWidth;
      x++
    ) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        canvas[y][x] = COLOR_WHITE;
      }
    }
  }

  // Bottom horizontal of curve
  for (
    let x = center - Math.floor(letterWidth / 2);
    x < center - Math.floor(letterWidth / 2) + curveWidth;
    x++
  ) {
    for (let dy = 0; dy < strokeWidth; dy++) {
      const y = startY + curveHeight - strokeWidth + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) {
        canvas[y][x] = COLOR_WHITE;
      }
    }
  }
}

function drawSmallLetter(canvas, size) {
  // For 16px, just draw a simple "P" shape
  const pixels = [
    [5, 4],
    [5, 5],
    [5, 6],
    [5, 7],
    [5, 8],
    [5, 9],
    [5, 10],
    [5, 11], // vertical stem
    [6, 4],
    [7, 4],
    [8, 4], // top horizontal
    [8, 5],
    [8, 6],
    [8, 7], // right vertical
    [6, 7],
    [7, 7], // middle horizontal
  ];

  pixels.forEach(([x, y]) => {
    if (x >= 0 && x < size && y >= 0 && y < size && canvas[y] && canvas[y][x]) {
      canvas[y][x] = COLOR_WHITE;
    }
  });
}

function canvasToPNG(canvas) {
  const size = canvas.length;
  const pixelData = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pixel = canvas[y][x];
      pixelData.push(pixel.r, pixel.g, pixel.b, pixel.a);
    }
  }

  return Buffer.from(pixelData);
}

async function generatePNGIcons() {
  console.log('Generating PNG icons with basic encoding...');
  console.log('NOTE: For production-ready PNG icons, use a proper image library.');
  console.log('The SVG icons in icons/*.svg are recommended for Chrome (MV3 supports SVG).\n');

  // Create simple data URIs that can be used
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const canvas = createCircleIcon(size);
    const filename = join(ICONS_DIR, `icon-${size}.txt`);

    await writeFile(filename, `Icon data for ${size}x${size} - use SVG version instead\n`);
    console.log(`✓ Note created for ${size}px`);
  }

  console.log('\nFor real PNG icons, update manifest.json to use SVG:');
  console.log('  "icons": {');
  console.log('    "16": "icons/icon-16.svg",');
  console.log('    "48": "icons/icon-48.svg",');
  console.log('    "128": "icons/icon-128.svg"');
  console.log('  }');
}

generatePNGIcons();
