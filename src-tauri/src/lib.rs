pub mod ai;
pub mod commands;
pub mod db;
pub mod platform;
pub mod session;
pub mod state;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init_db(&handle).await {
                    eprintln!("Failed to init db: {e}");
                }
            });

            let show_i = MenuItem::with_id(app, "show", "Show FocusMode", true, None::<&str>)?;
            let focus_i =
                MenuItem::with_id(app, "focus", "Start 25min Focus", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &focus_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("FocusMode")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "focus" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                            let _ = w.emit("tray-quick-focus", ());
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_session,
            commands::pause_session,
            commands::resume_session,
            commands::end_session,
            commands::get_session_state,
            commands::get_settings,
            commands::save_settings,
            commands::get_stats,
            commands::get_session_history,
            commands::log_distraction,
            commands::get_insights,
            commands::refine_intent,
            commands::check_ollama,
            commands::list_installed_apps,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
