mod macos;
#[cfg(target_os = "windows")]
mod windows;

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub bundle_id: String,
}

#[derive(Debug, Error)]
pub enum BlockerError {
    #[error("monitoring already active")]
    AlreadyMonitoring,
    #[error("monitoring not active")]
    NotMonitoring,
    #[error("platform error: {0}")]
    Platform(String),
    #[error("site blocking not supported")]
    SiteBlockingUnsupported,
}

pub trait PlatformBlocker: Send + Sync {
    fn start_monitoring(
        &self,
        blocklist: Vec<String>,
        app_handle: tauri::AppHandle,
    ) -> Result<(), BlockerError>;
    fn stop_monitoring(&self) -> Result<(), BlockerError>;
    fn get_frontmost_app(&self) -> Option<AppInfo>;
    fn block_sites(&self, _domains: Vec<String>) -> Result<(), BlockerError> {
        Err(BlockerError::SiteBlockingUnsupported)
    }
    fn unblock_sites(&self) -> Result<(), BlockerError> {
        Ok(())
    }
    fn list_installed_apps(&self) -> Result<Vec<AppInfo>, BlockerError>;
}

pub fn create_blocker() -> Box<dyn PlatformBlocker> {
    #[cfg(target_os = "macos")]
    {
        return Box::new(macos::MacOSBlocker::new());
    }
    #[cfg(target_os = "windows")]
    {
        return Box::new(windows::WindowsBlocker::new());
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        struct NoopBlocker;
        impl PlatformBlocker for NoopBlocker {
            fn start_monitoring(
                &self,
                _: Vec<String>,
                _: tauri::AppHandle,
            ) -> Result<(), BlockerError> {
                Ok(())
            }
            fn stop_monitoring(&self) -> Result<(), BlockerError> {
                Ok(())
            }
            fn get_frontmost_app(&self) -> Option<AppInfo> {
                None
            }
            fn list_installed_apps(&self) -> Result<Vec<AppInfo>, BlockerError> {
                Ok(vec![])
            }
        }
        Box::new(NoopBlocker)
    }
}
