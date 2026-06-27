use crate::ai;
use crate::db;
use crate::platform::AppInfo;
use crate::session::{
    AppSettings, DistractionLog, Insights, SessionConfig, SessionRecord, SessionState, StatsSummary,
};
use crate::state::AppState;
use chrono::Utc;
use std::sync::Arc;
use tauri::AppHandle;

static APP_STATE: std::sync::OnceLock<Arc<AppState>> = std::sync::OnceLock::new();

fn get_state(app: &AppHandle) -> Arc<AppState> {
    APP_STATE
        .get_or_init(|| {
            let state = Arc::new(AppState::new());
            state.set_handle(app.clone());
            state
        })
        .clone()
}

#[tauri::command]
pub async fn start_session(
    app: AppHandle,
    config: SessionConfig,
) -> Result<SessionState, String> {
    get_state(&app).start_session(config)
}

#[tauri::command]
pub async fn pause_session(app: AppHandle) -> Result<SessionState, String> {
    Ok(get_state(&app).pause())
}

#[tauri::command]
pub async fn resume_session(app: AppHandle) -> Result<SessionState, String> {
    Ok(get_state(&app).resume())
}

#[tauri::command]
pub async fn end_session(app: AppHandle) -> Result<SessionState, String> {
    let state = get_state(&app);
    let session = state.end();

    if !session.id.is_empty() && session.elapsed_seconds > 0 {
        let strictness = match session.config.strictness {
            crate::session::Strictness::Soft => "soft",
            crate::session::Strictness::Medium => "medium",
            crate::session::Strictness::Hard => "hard",
        };
        let record = SessionRecord {
            id: session.id.clone(),
            started_at: session
                .started_at
                .map(|t| t.to_rfc3339())
                .unwrap_or_else(|| Utc::now().to_rfc3339()),
            ended_at: Utc::now().to_rfc3339(),
            duration_seconds: session.elapsed_seconds,
            intent: session.config.intent.clone(),
            theme: session.config.theme.clone(),
            distraction_count: session.distraction_count,
            focus_score: session.focus_score,
            strictness: strictness.into(),
        };
        db::save_session(&app, &record).await?;
    }

    Ok(session)
}

#[tauri::command]
pub async fn get_session_state(app: AppHandle) -> Result<SessionState, String> {
    Ok(get_state(&app).tick())
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    db::load_settings(&app).await
}

#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    db::save_settings(&app, &settings).await
}

#[tauri::command]
pub async fn get_stats(app: AppHandle) -> Result<StatsSummary, String> {
    db::get_stats(&app).await
}

#[tauri::command]
pub async fn get_session_history(app: AppHandle) -> Result<Vec<SessionRecord>, String> {
    db::get_session_history(&app).await
}

#[tauri::command]
pub async fn log_distraction(
    app: AppHandle,
    log: DistractionLog,
) -> Result<SessionState, String> {
    db::log_distraction(
        &app,
        &log.session_id,
        &log.tag,
        log.app_name.as_deref(),
    )
    .await?;
    Ok(get_state(&app).record_distraction())
}

#[tauri::command]
pub async fn get_insights(app: AppHandle) -> Result<Insights, String> {
    db::get_insights(&app).await
}

#[tauri::command]
pub async fn refine_intent(raw_intent: String) -> Result<String, String> {
    ai::refine_intent_with_ollama(&raw_intent).await
}

#[tauri::command]
pub async fn check_ollama() -> Result<bool, String> {
    Ok(ai::check_ollama_available().await)
}

#[tauri::command]
pub async fn list_installed_apps(_app: AppHandle) -> Result<Vec<AppInfo>, String> {
    let blocker = crate::platform::create_blocker();
    blocker.list_installed_apps().map_err(|e| e.to_string())
}
