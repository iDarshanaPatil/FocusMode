use chrono::{DateTime, Local, Timelike};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const DB_NAME: &str = "focusmode.db";
/// Ignore aborted sessions shorter than this when computing insights.
const MIN_SESSION_SECONDS: i64 = 60;

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(DB_NAME))
}

fn with_db<F, T>(app: &AppHandle, f: F) -> Result<T, String>
where
    F: FnOnce(&Connection) -> Result<T, String>,
{
    let path = db_path(app)?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    init_schema(&conn)?;
    f(&conn)
}

fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            ended_at TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            intent TEXT NOT NULL,
            theme TEXT NOT NULL,
            distraction_count INTEGER NOT NULL DEFAULT 0,
            focus_score INTEGER NOT NULL DEFAULT 100,
            strictness TEXT NOT NULL DEFAULT 'soft'
        );
        CREATE TABLE IF NOT EXISTS distraction_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            tag TEXT NOT NULL,
            app_name TEXT,
            logged_at TEXT NOT NULL
        );
        ",
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn init_db(app: &AppHandle) -> Result<(), String> {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || with_db(&app, |_| Ok(())))
        .await
        .map_err(|e| e.to_string())?
}

pub async fn load_settings(app: &AppHandle) -> Result<crate::session::AppSettings, String> {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            let mut stmt = conn
                .prepare("SELECT key, value FROM settings WHERE key = 'app'")
                .map_err(|e| e.to_string())?;
            let mut rows = stmt
                .query([])
                .map_err(|e| e.to_string())?;
            if let Some(row) = rows.next().map_err(|e| e.to_string())? {
                let value: String = row.get(1).map_err(|e| e.to_string())?;
                if let Ok(settings) =
                    serde_json::from_str::<crate::session::AppSettings>(&value)
                {
                    return Ok(settings);
                }
            }
            Ok(crate::session::AppSettings::default())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn save_settings(
    app: &AppHandle,
    settings: &crate::session::AppSettings,
) -> Result<(), String> {
    let app = app.clone();
    let settings = settings.clone();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            let value = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
            conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('app', ?1)",
                params![value],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn save_session(
    app: &AppHandle,
    record: &crate::session::SessionRecord,
) -> Result<(), String> {
    let app = app.clone();
    let record = record.clone();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            conn.execute(
                "INSERT INTO sessions (id, started_at, ended_at, duration_seconds, intent, theme, distraction_count, focus_score, strictness)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    record.id,
                    record.started_at,
                    record.ended_at,
                    record.duration_seconds as i64,
                    record.intent,
                    record.theme,
                    record.distraction_count as i64,
                    record.focus_score as i64,
                    record.strictness,
                ],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn get_session_history(
    app: &AppHandle,
) -> Result<Vec<crate::session::SessionRecord>, String> {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT id, started_at, ended_at, duration_seconds, intent, theme, distraction_count, focus_score, strictness
                     FROM sessions ORDER BY started_at DESC LIMIT 50",
                )
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map([], |row| {
                    Ok(crate::session::SessionRecord {
                        id: row.get(0)?,
                        started_at: row.get(1)?,
                        ended_at: row.get(2)?,
                        duration_seconds: row.get::<_, i64>(3)? as u64,
                        intent: row.get(4)?,
                        theme: row.get(5)?,
                        distraction_count: row.get::<_, i64>(6)? as u32,
                        focus_score: row.get::<_, i64>(7)? as i32,
                        strictness: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn log_distraction(
    app: &AppHandle,
    session_id: &str,
    tag: &str,
    app_name: Option<&str>,
) -> Result<(), String> {
    let app = app.clone();
    let session_id = session_id.to_string();
    let tag = tag.to_string();
    let app_name = app_name.unwrap_or("").to_string();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            let now = chrono::Utc::now().to_rfc3339();
            conn.execute(
                "INSERT INTO distraction_logs (session_id, tag, app_name, logged_at) VALUES (?1, ?2, ?3, ?4)",
                params![session_id, tag, app_name, now],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

pub async fn get_stats(app: &AppHandle) -> Result<crate::session::StatsSummary, String> {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            let settings = load_settings_sync(conn)?;
            let streak = compute_streak_sync(conn, &settings)?;

            let total_sessions: i64 = conn
                .query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0))
                .unwrap_or(0);
            let today_minutes: i64 = conn
                .query_row(
                    "SELECT COALESCE(SUM(duration_seconds), 0) FROM sessions WHERE date(started_at) = date('now')",
                    [],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            let total_minutes: i64 = conn
                .query_row(
                    "SELECT COALESCE(SUM(duration_seconds), 0) FROM sessions",
                    [],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            let avg_score: f64 = conn
                .query_row(
                    "SELECT COALESCE(AVG(focus_score), 100) FROM sessions",
                    [],
                    |r| r.get(0),
                )
                .unwrap_or(100.0);

            Ok(crate::session::StatsSummary {
                streak_days: streak,
                today_minutes: (today_minutes / 60) as u32,
                daily_goal_minutes: settings.daily_goal_minutes,
                total_sessions: total_sessions as u32,
                total_focus_minutes: (total_minutes / 60) as u32,
                avg_focus_score: avg_score as f32,
            })
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

fn load_settings_sync(conn: &Connection) -> Result<crate::session::AppSettings, String> {
    let mut stmt = conn
        .prepare("SELECT value FROM settings WHERE key = 'app'")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let value: String = row.get(0).map_err(|e| e.to_string())?;
        if let Ok(settings) = serde_json::from_str::<crate::session::AppSettings>(&value) {
            return Ok(settings);
        }
    }
    Ok(crate::session::AppSettings::default())
}

fn compute_streak_sync(
    conn: &Connection,
    settings: &crate::session::AppSettings,
) -> Result<u32, String> {
    let goal_secs = settings.daily_goal_minutes as i64 * 60;
    let mut stmt = conn
        .prepare(
            "SELECT date(started_at) as day, SUM(duration_seconds) as total
             FROM sessions GROUP BY date(started_at) ORDER BY day DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;

    let mut streak = 0u32;
    let mut expected = chrono::Utc::now().date_naive();
    for row in rows {
        let (day_str, total) = row.map_err(|e| e.to_string())?;
        let day = chrono::NaiveDate::parse_from_str(&day_str, "%Y-%m-%d").unwrap_or(expected);
        if day == expected && total >= goal_secs {
            streak += 1;
            expected -= chrono::Duration::days(1);
        } else if day < expected {
            break;
        }
    }
    Ok(streak)
}

fn parse_started_at(raw: &str) -> Option<DateTime<Local>> {
    DateTime::parse_from_rfc3339(raw)
        .ok()
        .map(|dt| dt.with_timezone(&Local))
        .or_else(|| {
            chrono::NaiveDateTime::parse_from_str(raw, "%Y-%m-%dT%H:%M:%S%.fZ")
                .ok()
                .map(|naive| naive.and_local_timezone(Local).single())
                .flatten()
        })
}

fn format_local_hour(hour: u32) -> String {
    let h = hour % 24;
    match h {
        0 => "12:00 AM".to_string(),
        1..=11 => format!("{h}:00 AM"),
        12 => "12:00 PM".to_string(),
        _ => format!("{}:00 PM", h - 12),
    }
}

/// Rank hours by total focus minutes (local time), not session count.
fn compute_best_focus_hours(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT started_at, duration_seconds FROM sessions
             WHERE duration_seconds >= ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![MIN_SESSION_SECONDS], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;

    let mut minutes_by_hour = [0u64; 24];
    for row in rows {
        let (started_at, duration_secs) = row.map_err(|e| e.to_string())?;
        if let Some(local) = parse_started_at(&started_at) {
            let hour = local.hour() as usize;
            minutes_by_hour[hour] += (duration_secs / 60) as u64;
        }
    }

    let mut ranked: Vec<(usize, u64)> = minutes_by_hour
        .iter()
        .enumerate()
        .map(|(hour, &mins)| (hour, mins))
        .filter(|(_, mins)| *mins > 0)
        .collect();

    ranked.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    Ok(ranked
        .into_iter()
        .take(3)
        .map(|(hour, _)| format_local_hour(hour as u32))
        .collect())
}

fn compute_suggested_session_minutes(conn: &Connection) -> u32 {
    let avg_secs: f64 = conn
        .query_row(
            "SELECT COALESCE(AVG(duration_seconds), 0) FROM sessions WHERE duration_seconds >= ?1",
            params![MIN_SESSION_SECONDS],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    if avg_secs <= 0.0 {
        return 25;
    }

    (avg_secs / 60.0).round() as u32
}

pub async fn get_insights(app: &AppHandle) -> Result<crate::session::Insights, String> {
    let app = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        with_db(&app, |conn| {
            let best_hours = compute_best_focus_hours(conn)?;

            let mut tags_stmt = conn
                .prepare(
                    "SELECT tag, COUNT(*) as cnt FROM distraction_logs
                     GROUP BY tag ORDER BY cnt DESC LIMIT 3",
                )
                .map_err(|e| e.to_string())?;
            let top_distractions: Vec<String> = tags_stmt
                .query_map([], |row| row.get(0))
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();

            let suggested_session_minutes = compute_suggested_session_minutes(conn);

            let mut week_stmt = conn
                .prepare(
                    "SELECT date(started_at) as day, SUM(duration_seconds)/60 as total
                     FROM sessions WHERE started_at >= date('now', '-6 days')
                     GROUP BY day ORDER BY day ASC",
                )
                .map_err(|e| e.to_string())?;
            let weekly_minutes: Vec<u32> = week_stmt
                .query_map([], |row| row.get::<_, i64>(1))
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .map(|m| m as u32)
                .collect();

            Ok(crate::session::Insights {
                best_hours,
                top_distractions,
                suggested_session_minutes,
                weekly_minutes,
            })
        })
    })
    .await
    .map_err(|e| e.to_string())?
}
