// Tauri 2 entry point. The web bundle from apps/web/dist is loaded by the
// native window — see tauri.conf.json.
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running ParentScript desktop app");
}
