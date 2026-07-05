# ParentScript — Desktop (Tauri 2)

The ParentScript desktop app is a thin native shell around the web bundle.
It uses [Tauri 2](https://tauri.app/) so the same React/Vite/TypeScript code
that powers [parentscript.app](https://parentscript.app) runs on macOS and
Windows without a separate codebase.

## Layout

```
apps/desktop/
├── package.json              # @parentscript/desktop — wraps the Tauri CLI
└── src-tauri/                # The Rust crate (Tauri 2 standard layout)
    ├── Cargo.toml            # Rust deps (tauri 2, serde, serde_json)
    ├── build.rs              # tauri_build::build()
    ├── tauri.conf.json       # Window + bundle config (brand-aligned)
    └── src/
        ├── main.rs           # Binary entry — calls parentscript_desktop_lib::run()
        └── lib.rs            # Tauri Builder + commands go here
```

## Brand alignment

The window picks up ParentScript's clinical-warm, light/indigo aesthetic:

| Property | Value | Source |
|----------|-------|--------|
| Title | `ParentScript` (sentence case) | Brand voice guide |
| Background | `#fafafa` (neutral.50) | `packages/design/tokens.json` |
| Width × Height | 1280 × 800 | Tauri default with clinical-warm scale |
| Min Width × Min Height | 960 × 600 | Smallest usable therapist-side layout |

If you change a token in `packages/design/tokens.json`, mirror the change in
`tauri.conf.json` → `app.windows[0].backgroundColor`. The native window
can't read JSON tokens at runtime — keep them in sync.

## Prerequisites

- **Rust** 1.70+ (`rustup install stable`)
- **Node.js** 20+ (matches the rest of the monorepo)
- **Tauri 2 platform deps** — see <https://tauri.app/start/prerequisites/>
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Microsoft C++ Build Tools + WebView2 runtime

## Develop

Run the web dev server and the Tauri window together. Tauri calls
`npm run dev --workspace=apps/web` automatically before opening the window,
so Vite is already serving on `http://localhost:5173` by the time the native
shell appears.

```bash
npm run dev --workspace=@parentscript/desktop
```

## Build

### macOS (.dmg + .app, universal binary)

```bash
npm run build --workspace=@parentscript/desktop
```

Output: `src-tauri/target/release/bundle/macos/ParentScript.app` and
`src-tauri/target/release/bundle/dmg/ParentScript_0.1.0_universal.dmg`.

To force the universal-apple-darwin target explicitly:

```bash
npm run build:mac --workspace=@parentscript/desktop
```

### Windows (.msi + .exe)

```bash
npm run build:win --workspace=@parentscript/desktop
```

Output: `src-tauri/target/release/bundle/msi/ParentScript_0.1.0_x64_en-US.msi`
and `src-tauri/target/release/bundle/nsis/ParentScript_0.1.0_x64-setup.exe`.

> The `npm run build` script runs `npm run build --workspace=apps/web` first
> (via `beforeBuildCommand` in `tauri.conf.json`) so the latest web bundle is
> always included in the installer.

## Code signing & notarization

Not configured yet. Before public release:

1. Add `bundle.macOS.signingIdentity`, `entitlements`, and `providerShortName`
   to `tauri.conf.json`.
2. Set `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, and
   `APPLE_SIGNING_IDENTITY` env vars in CI.
3. Mirror with `bundle.windows.certificateThumbprint` for Windows MSIX/NSIS.

## What's next

- Native tray icon for therapist-side always-on workflows.
- Deep links (`parentscript://`) so auth emails open straight in the desktop app.
- Auto-update via `tauri-plugin-updater` once we have a stable release channel.
- Code-signing pipeline (see above).
