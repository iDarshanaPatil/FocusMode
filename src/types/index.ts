export type SessionPhase = "idle" | "focus" | "break" | "paused" | "complete";
export type Strictness = "soft" | "medium" | "hard";
export type TimerMode = "countdown" | "count_up";
export type View = "home" | "setup" | "sanctuary" | "settings" | "stats";

export interface SessionConfig {
  work_minutes: number;
  break_minutes: number;
  long_break_minutes: number;
  rounds_before_long_break: number;
  mode: TimerMode;
  strictness: Strictness;
  intent: string;
  blocklist: string[];
  theme: string;
}

export interface SessionState {
  id: string;
  phase: SessionPhase;
  config: SessionConfig;
  started_at: string | null;
  phase_started_at: string | null;
  elapsed_seconds: number;
  remaining_seconds: number;
  current_round: number;
  distraction_count: number;
  focus_score: number;
}

export interface AppSettings {
  daily_goal_minutes: number;
  default_strictness: Strictness;
  default_theme: string;
  blocklist: string[];
  dnd_enabled: boolean;
  sound_enabled: boolean;
  last_preset: SessionConfig;
}

export interface SessionRecord {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  intent: string;
  theme: string;
  distraction_count: number;
  focus_score: number;
  strictness: string;
}

export interface StatsSummary {
  streak_days: number;
  today_minutes: number;
  daily_goal_minutes: number;
  total_sessions: number;
  total_focus_minutes: number;
  avg_focus_score: number;
}

export interface Insights {
  best_hours: string[];
  top_distractions: string[];
  suggested_session_minutes: number;
  weekly_minutes: number[];
}

export interface AppInfo {
  name: string;
  bundle_id: string;
}

export const DEFAULT_CONFIG: SessionConfig = {
  work_minutes: 25,
  break_minutes: 5,
  long_break_minutes: 15,
  rounds_before_long_break: 4,
  mode: "countdown",
  strictness: "soft",
  intent: "",
  blocklist: [
    "Safari",
    "Google Chrome",
    "Firefox",
    "Messages",
    "Slack",
    "Discord",
    "Telegram",
    "Twitter",
    "Instagram",
    "YouTube",
    "Reddit",
    "TikTok",
  ],
  theme: "midnight",
};
