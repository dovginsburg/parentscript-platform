/**
 * Generate PNG icons for the extension.
 * Creates simple SVG-based icons at 16, 48, and 128px.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ICONS_DIR = join(__dirname, '..', 'icons');

// ParentScript brand colors: indigo gradient
const ICON_SVG = size => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#grad)" />

  <!-- "P" for ParentScript -->
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-weight="700"
    font-size="${size * 0.6}"
    fill="white"
  >P</text>
</svg>`;

async function generateIcons() {
  const sizes = [16, 48, 128];

  console.log('Generating ParentScript icons...');

  for (const size of sizes) {
    const svg = ICON_SVG(size);
    const filename = join(ICONS_DIR, `icon-${size}.svg`);
    await writeFile(filename, svg);
    console.log(`✓ Generated ${filename}`);
  }

  console.log('\nSVG icons generated!');
  console.log('Note: Chrome accepts SVG icons. For PNG conversion, use:');
  console.log('  brew install librsvg');
  console.log(
    '  for i in 16 48 128; do rsvg-convert -w $i -h $i icons/icon-$i.svg -o icons/icon-$i.png; done'
  );
}

generateIcons();
