# ParentScript Browser Extension

Quick-access Chrome extension for ParentScript skill library.

## ⚠️ Build first — the committed tree no longer ships pre-built bundles

The bundles that Chrome loads (`background.js`, `content.js`, `popup.js`,
`content.css`) are **generated** from `src/*.ts` by esbuild and are
`.gitignore`d at the root of this directory. You must run `npm run build`
once before "Load unpacked" — otherwise Chrome will fail to load the
service worker. After the first build, re-run it whenever `src/*.ts` changes.

```bash
npm install
npm run build
```

## Features

- **Popup UI**: Searchable skill browser (click extension icon)
- **Context menu**: Right-click selected text → "Search ParentScript for '%s'"
- **Floating action button**: Floating launcher on every page
- **API-driven**: skills are fetched from the ParentScript API (no offline list)

## Load in Chrome

1. Run `npm install && npm run build` (see above)
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `apps/browser-extension/`

## Development

```bash
npm run dev   # Watch mode
```

## Tech

- Manifest V3
- TypeScript + esbuild
- No external dependencies at runtime

## Icons

SVG icons generated in `icons/`. For PNG conversion:

```bash
brew install librsvg
for i in 16 48 128; do
  rsvg-convert -w $i -h $i icons/icon-$i.svg -o icons/icon-$i.png
done
```

Then update `manifest.json` to reference `.png` instead of `.svg`.
