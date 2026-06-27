import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  AppInfo,
  AppSettings,
  Insights,
  SessionConfig,
  SessionRecord,
  SessionState,
  StatsSummary,
  View,
} from "../types";

export async function startSession(config: SessionConfig): Promise<SessionState> {
  return invoke("start_session", { config });
}

export async function pauseSession(): Promise<SessionState> {
  return invoke("pause_session");
}

export async function resumeSession(): Promise<SessionState> {
  return invoke("resume_session");
}

export async function endSession(): Promise<SessionState> {
  return invoke("end_session");
}

export async function getSessionState(): Promise<SessionState> {
  return invoke("get_session_state");
}

export async function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function getStats(): Promise<StatsSummary> {
  return invoke("get_stats");
}

export async function getSessionHistory(): Promise<SessionRecord[]> {
  return invoke("get_session_history");
}

export async function logDistraction(
  sessionId: string,
  tag: string,
  appName?: string
): Promise<SessionState> {
  return invoke("log_distraction", {
    log: { session_id: sessionId, tag, app_name: appName ?? null },
  });
}

export async function getInsights(): Promise<Insights> {
  return invoke("get_insights");
}

export async function refineIntent(raw: string): Promise<string> {
  return invoke("refine_intent", { rawIntent: raw });
}

export async function checkOllama(): Promise<boolean> {
  return invoke("check_ollama");
}

export async function listInstalledApps(): Promise<AppInfo[]> {
  return invoke("list_installed_apps");
}

export function onBlockedApp(
  callback: (payload: { app_name: string; process_path: string }) => void
) {
  return listen<{ app_name: string; process_path: string }>(
    "blocked-app-detected",
    (e) => callback(e.payload)
  );
}

export function onTrayQuickFocus(callback: () => void) {
  return listen("tray-quick-focus", callback);
}

export type { View };
