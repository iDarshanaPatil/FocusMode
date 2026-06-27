use crate::platform::{create_blocker, PlatformBlocker};
use crate::session::{SessionConfig, SessionState};
use parking_lot::Mutex;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

pub struct AppState {
    pub session: Mutex<SessionState>,
    pub blocker: Arc<Box<dyn PlatformBlocker>>,
    pub app_handle: Mutex<Option<AppHandle>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            session: Mutex::new(SessionState::idle()),
            blocker: Arc::new(create_blocker()),
            app_handle: Mutex::new(None),
        }
    }

    pub fn set_handle(&self, handle: AppHandle) {
        *self.app_handle.lock() = Some(handle);
    }

    pub fn start_session(&self, config: SessionConfig) -> Result<SessionState, String> {
        let state = SessionState::start(config.clone());
        *self.session.lock() = state.clone();

        if let Some(handle) = self.app_handle.lock().clone() {
            self.blocker
                .start_monitoring(config.blocklist.clone(), handle)
                .map_err(|e| e.to_string())?;
        }

        Ok(state)
    }

    pub fn stop_blocking(&self) {
        let _ = self.blocker.stop_monitoring();
    }

    pub fn pause(&self) -> SessionState {
        self.stop_blocking();
        let mut s = self.session.lock();
        s.pause();
        s.clone()
    }

    pub fn resume(&self) -> SessionState {
        let mut s = self.session.lock();
        s.resume();
        let snapshot = s.clone();
        drop(s);

        if snapshot.phase == crate::session::SessionPhase::Focus {
            if let Some(handle) = self.app_handle.lock().clone() {
                let _ = self.blocker.start_monitoring(
                    snapshot.config.blocklist.clone(),
                    handle,
                );
            }
        }
        snapshot
    }

    pub fn end(&self) -> SessionState {
        self.stop_blocking();
        let mut s = self.session.lock();
        s.complete();
        s.clone()
    }

    pub fn get(&self) -> SessionState {
        self.session.lock().clone()
    }

    pub fn tick(&self) -> SessionState {
        let mut s = self.session.lock();
        if let Some(new_phase) = s.tick() {
            if let Some(handle) = self.app_handle.lock().clone() {
                let _ = handle.emit("phase-changed", new_phase);
            }
        }
        s.clone()
    }

    pub fn record_distraction(&self) -> SessionState {
        let mut s = self.session.lock();
        s.record_distraction();
        s.clone()
    }
}
