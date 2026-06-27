use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionPhase {
    Idle,
    Focus,
    Break,
    Paused,
    Complete,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Strictness {
    Soft,
    Medium,
    Hard,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TimerMode {
    Countdown,
    CountUp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionConfig {
    pub work_minutes: u32,
    pub break_minutes: u32,
    pub long_break_minutes: u32,
    pub rounds_before_long_break: u32,
    pub mode: TimerMode,
    pub strictness: Strictness,
    pub intent: String,
    pub blocklist: Vec<String>,
    pub theme: String,
}

impl Default for SessionConfig {
    fn default() -> Self {
        Self {
            work_minutes: 25,
            break_minutes: 5,
            long_break_minutes: 15,
            rounds_before_long_break: 4,
            mode: TimerMode::Countdown,
            strictness: Strictness::Soft,
            intent: String::new(),
            blocklist: default_blocklist(),
            theme: "midnight".into(),
        }
    }
}

pub fn default_blocklist() -> Vec<String> {
    vec![
        "Safari".into(),
        "Google Chrome".into(),
        "Firefox".into(),
        "Messages".into(),
        "Slack".into(),
        "Discord".into(),
        "Telegram".into(),
        "Twitter".into(),
        "Instagram".into(),
        "YouTube".into(),
        "Reddit".into(),
        "TikTok".into(),
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub id: String,
    pub phase: SessionPhase,
    pub config: SessionConfig,
    pub started_at: Option<DateTime<Utc>>,
    pub phase_started_at: Option<DateTime<Utc>>,
    pub elapsed_seconds: u64,
    pub remaining_seconds: u64,
    pub current_round: u32,
    pub distraction_count: u32,
    pub focus_score: i32,
}

impl SessionState {
    pub fn idle() -> Self {
        Self {
            id: String::new(),
            phase: SessionPhase::Idle,
            config: SessionConfig::default(),
            started_at: None,
            phase_started_at: None,
            elapsed_seconds: 0,
            remaining_seconds: 0,
            current_round: 1,
            distraction_count: 0,
            focus_score: 0,
        }
    }

    pub fn start(config: SessionConfig) -> Self {
        let work_secs = config.work_minutes as u64 * 60;
        Self {
            id: Uuid::new_v4().to_string(),
            phase: SessionPhase::Focus,
            remaining_seconds: work_secs,
            config,
            started_at: Some(Utc::now()),
            phase_started_at: Some(Utc::now()),
            elapsed_seconds: 0,
            current_round: 1,
            distraction_count: 0,
            focus_score: 100,
        }
    }

    pub fn tick(&mut self) -> Option<SessionPhase> {
        if self.phase != SessionPhase::Focus && self.phase != SessionPhase::Break {
            return None;
        }

        self.elapsed_seconds += 1;

        match self.config.mode {
            TimerMode::Countdown => {
                if self.remaining_seconds > 0 {
                    self.remaining_seconds -= 1;
                }
                if self.remaining_seconds == 0 {
                    return Some(self.advance_phase());
                }
            }
            TimerMode::CountUp => {
                self.remaining_seconds += 1;
            }
        }
        None
    }

    fn advance_phase(&mut self) -> SessionPhase {
        match self.phase {
            SessionPhase::Focus => {
                if self.current_round >= self.config.rounds_before_long_break {
                    self.phase = SessionPhase::Break;
                    self.remaining_seconds = self.config.long_break_minutes as u64 * 60;
                    self.current_round = 1;
                } else {
                    self.phase = SessionPhase::Break;
                    self.remaining_seconds = self.config.break_minutes as u64 * 60;
                    self.current_round += 1;
                }
            }
            SessionPhase::Break => {
                self.phase = SessionPhase::Focus;
                self.remaining_seconds = self.config.work_minutes as u64 * 60;
            }
            _ => {}
        }
        self.phase_started_at = Some(Utc::now());
        self.phase
    }

    pub fn pause(&mut self) {
        if self.phase == SessionPhase::Focus || self.phase == SessionPhase::Break {
            self.phase = SessionPhase::Paused;
        }
    }

    pub fn resume(&mut self) {
        if self.phase == SessionPhase::Paused {
            // Resume to focus if we still have work time, otherwise break
            if self.remaining_seconds > 0 || self.config.mode == TimerMode::CountUp {
                self.phase = SessionPhase::Focus;
            } else {
                self.phase = SessionPhase::Break;
            }
            self.phase_started_at = Some(Utc::now());
        }
    }

    pub fn record_distraction(&mut self) {
        self.distraction_count += 1;
        self.focus_score = (self.focus_score - 5).max(0);
    }

    pub fn complete(&mut self) {
        self.phase = SessionPhase::Complete;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub daily_goal_minutes: u32,
    pub default_strictness: Strictness,
    pub default_theme: String,
    pub blocklist: Vec<String>,
    pub dnd_enabled: bool,
    pub sound_enabled: bool,
    pub last_preset: SessionConfig,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            daily_goal_minutes: 120,
            default_strictness: Strictness::Soft,
            default_theme: "midnight".into(),
            blocklist: default_blocklist(),
            dnd_enabled: false,
            sound_enabled: true,
            last_preset: SessionConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionRecord {
    pub id: String,
    pub started_at: String,
    pub ended_at: String,
    pub duration_seconds: u64,
    pub intent: String,
    pub theme: String,
    pub distraction_count: u32,
    pub focus_score: i32,
    pub strictness: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsSummary {
    pub streak_days: u32,
    pub today_minutes: u32,
    pub daily_goal_minutes: u32,
    pub total_sessions: u32,
    pub total_focus_minutes: u32,
    pub avg_focus_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistractionLog {
    pub session_id: String,
    pub tag: String,
    pub app_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Insights {
    pub best_hours: Vec<String>,
    pub top_distractions: Vec<String>,
    pub suggested_session_minutes: u32,
    pub weekly_minutes: Vec<u32>,
}
