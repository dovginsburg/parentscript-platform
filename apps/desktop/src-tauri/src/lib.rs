// ParentScript — Tauri 2 library crate
//
// The web bundle from `apps/web/dist` is loaded into the native window by
// `tauri.conf.json`. This crate is intentionally minimal: the desktop app is
// a thin native shell around the web app so the same React/Vite/TS code runs
// in the browser, on mobile (Capacitor), and on the desktop (Tauri).
//
// When we need desktop-specific behavior (filesystem access, deep links,
// tray icon, native menu, auto-update), add `#[tauri::command]` functions
// here and register them on the `Builder` below.

use tauri::{menu::{MenuBuilder, MenuItemBuilder}, Manager};

/// Open external URL in default browser
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    if url.starts_with("https://parentscript.app") || url.starts_with("https://docs.parentscript.app") {
        open::that(url).map_err(|e| e.to_string())
    } else {
        Err("Invalid URL domain".to_string())
    }
}

/// Get app version
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Tauri 2 entry point — invoked from `main.rs`.
// Window dimensions, title, and background color are configured declaratively
// in `tauri.conf.json` and match the design tokens in `packages/design/tokens.json`
// (neutral.50 = #fafafa for the surface, sentence-case "ParentScript" title).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Build native menu bar
            let menu = MenuBuilder::new(app)
                .item(&MenuItemBuilder::with_id("quit", "Quit ParentScript").build(app)?)
                .build()?;

            app.set_menu(menu)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_external,
            get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running ParentScript desktop app");
}