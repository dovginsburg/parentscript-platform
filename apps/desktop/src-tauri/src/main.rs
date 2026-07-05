// ParentScript — desktop entry point (Tauri 2)
//
// This binary is a thin shim that calls into the library crate. All real
// configuration (window, commands, plugins) lives in `lib.rs` so the same
// code can be reused on mobile targets later if we want.
//
// Window appearance is driven by `src-tauri/tauri.conf.json`. Brand colors
// come from `packages/design/tokens.json` — neutral.50 (#fafafa) is the
// surface color for the desktop window background, matching the web app's
// clinical-warm, light/indigo aesthetic.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    parentscript_desktop_lib::run();
}
