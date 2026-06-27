import { create } from "zustand";
import type { SessionConfig, SessionState, View } from "../types";
import { DEFAULT_CONFIG } from "../types";

interface AppStore {
  view: View;
  session: SessionState | null;
  showOverlay: boolean;
  overlayApp: string;
  showDistractionJournal: boolean;
  ollamaAvailable: boolean;
  setView: (view: View) => void;
  setSession: (session: SessionState | null) => void;
  setShowOverlay: (show: boolean, app?: string) => void;
  setShowDistractionJournal: (show: boolean) => void;
  setOllamaAvailable: (v: boolean) => void;
  draftConfig: SessionConfig;
  setDraftConfig: (config: Partial<SessionConfig>) => void;
}

const idleSession: SessionState = {
  id: "",
  phase: "idle",
  config: DEFAULT_CONFIG,
  started_at: null,
  phase_started_at: null,
  elapsed_seconds: 0,
  remaining_seconds: 0,
  current_round: 1,
  distraction_count: 0,
  focus_score: 100,
};

export const useAppStore = create<AppStore>((set) => ({
  view: "home",
  session: idleSession,
  showOverlay: false,
  overlayApp: "",
  showDistractionJournal: false,
  ollamaAvailable: false,
  draftConfig: DEFAULT_CONFIG,
  setView: (view) => set({ view }),
  setSession: (session) => set({ session }),
  setShowOverlay: (show, app = "") =>
    set({ showOverlay: show, overlayApp: app }),
  setShowDistractionJournal: (show) => set({ showDistractionJournal: show }),
  setOllamaAvailable: (v) => set({ ollamaAvailable: v }),
  setDraftConfig: (partial) =>
    set((s) => ({ draftConfig: { ...s.draftConfig, ...partial } })),
}));
