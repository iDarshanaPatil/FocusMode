use super::{AppInfo, BlockerError, PlatformBlocker};
use active_win_pos_rs::get_active_window;
use parking_lot::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct MacOSBlocker {
    monitoring: AtomicBool,
    stop_flag: Arc<AtomicBool>,
    blocklist: Arc<Mutex<Vec<String>>>,
}

impl MacOSBlocker {
    pub fn new() -> Self {
        Self {
            monitoring: AtomicBool::new(false),
            stop_flag: Arc::new(AtomicBool::new(false)),
            blocklist: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

impl Default for MacOSBlocker {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformBlocker for MacOSBlocker {
    fn start_monitoring(
        &self,
        blocklist: Vec<String>,
        app_handle: AppHandle,
    ) -> Result<(), BlockerError> {
        if self.monitoring.swap(true, Ordering::SeqCst) {
            return Err(BlockerError::AlreadyMonitoring);
        }

        *self.blocklist.lock() = blocklist;
        self.stop_flag.store(false, Ordering::SeqCst);

        let stop_flag = self.stop_flag.clone();
        let blocklist = Arc::clone(&self.blocklist);
        let monitoring = Arc::new(AtomicBool::new(true));
        let monitoring_clone = monitoring.clone();

        thread::spawn(move || {
            while !stop_flag.load(Ordering::SeqCst) {
                if let Ok(active) = get_active_window() {
                    let app_name = active.app_name.to_lowercase();
                    let title = active.title.to_lowercase();
                    let list = blocklist.lock().clone();

                    for blocked in &list {
                        let blocked_lower = blocked.to_lowercase();
                        if app_name.contains(&blocked_lower)
                            || title.contains(&blocked_lower)
                            || active
                                .process_path
                                .to_string_lossy()
                                .to_lowercase()
                                .contains(&blocked_lower)
                        {
                            let _ = app_handle.emit(
                                "blocked-app-detected",
                                serde_json::json!({
                                    "app_name": active.app_name,
                                    "process_path": active.process_path.to_string_lossy(),
                                }),
                            );
                            break;
                        }
                    }
                }
                thread::sleep(Duration::from_millis(500));
            }
            monitoring_clone.store(false, Ordering::SeqCst);
        });

        Ok(())
    }

    fn stop_monitoring(&self) -> Result<(), BlockerError> {
        if !self.monitoring.swap(false, Ordering::SeqCst) {
            return Err(BlockerError::NotMonitoring);
        }
        self.stop_flag.store(true, Ordering::SeqCst);
        Ok(())
    }

    fn get_frontmost_app(&self) -> Option<AppInfo> {
        get_active_window().ok().map(|w| AppInfo {
            name: w.app_name,
            bundle_id: w.process_path.to_string_lossy().to_string(),
        })
    }

    fn list_installed_apps(&self) -> Result<Vec<AppInfo>, BlockerError> {
        use std::fs;
        use std::path::Path;

        let mut apps = Vec::new();
        let dirs = [
            "/Applications",
            "/System/Applications",
            &format!("{}/Applications", std::env::var("HOME").unwrap_or_default()),
        ];

        for dir in dirs {
            let path = Path::new(dir);
            if !path.exists() {
                continue;
            }
            if let Ok(entries) = fs::read_dir(path) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.extension().and_then(|e| e.to_str()) == Some("app") {
                        let name = p
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("Unknown")
                            .to_string();
                        apps.push(AppInfo {
                            name: name.clone(),
                            bundle_id: name,
                        });
                    }
                }
            }
        }

        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps.dedup_by(|a, b| a.name == b.name);
        Ok(apps)
    }
}
