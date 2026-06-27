use super::{AppInfo, BlockerError, PlatformBlocker};
use tauri::AppHandle;

/// Phase 1.5 stub — Windows blocking not yet implemented.
pub struct WindowsBlocker;

impl WindowsBlocker {
    pub fn new() -> Self {
        Self
    }
}

impl Default for WindowsBlocker {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformBlocker for WindowsBlocker {
    fn start_monitoring(
        &self,
        _blocklist: Vec<String>,
        _app_handle: AppHandle,
    ) -> Result<(), BlockerError> {
        Err(BlockerError::Platform(
            "Windows blocking is planned for Phase 1.5".into(),
        ))
    }

    fn stop_monitoring(&self) -> Result<(), BlockerError> {
        Ok(())
    }

    fn get_frontmost_app(&self) -> Option<AppInfo> {
        None
    }

    fn list_installed_apps(&self) -> Result<Vec<AppInfo>, BlockerError> {
        Err(BlockerError::Platform(
            "Windows app listing is planned for Phase 1.5".into(),
        ))
    }
}
