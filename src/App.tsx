import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "./stores/appStore";
import { Navigation } from "./components/layout/Navigation";
import { HomeView } from "./components/home/HomeView";
import { SetupView } from "./components/setup/SetupView";
import { SanctuaryView } from "./components/sanctuary/SanctuaryView";
import { SettingsView } from "./components/settings/SettingsView";
import { StatsView } from "./components/stats/StatsView";
import { BlockedOverlay } from "./components/sanctuary/BlockedOverlay";
import {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  getSessionState,
  getStats,
  getInsights,
  logDistraction,
  onBlockedApp,
  onTrayQuickFocus,
  checkOllama,
  getSettings,
  saveSettings,
} from "./lib/tauri";
import { DEFAULT_CONFIG } from "./types";
import type { SessionState, StatsSummary, Insights } from "./types";

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 528;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* optional */
  }
}

const IDLE_SESSION: SessionState = {
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

export default function App() {
  const {
    view,
    setView,
    session,
    setSession,
    showOverlay,
    setShowOverlay,
    setShowDistractionJournal,
    draftConfig,
    setDraftConfig,
    setOllamaAvailable,
  } = useAppStore();

  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const tickRef = useRef<number | null>(null);

  const refreshMeta = useCallback(async () => {
    try {
      setStats(await getStats());
      setInsights(await getInsights());
    } catch {
      /* db may be empty */
    }
  }, []);

  const handleStart = useCallback(
    async (config = draftConfig) => {
      try {
        const s = await startSession({ ...config, blocklist: config.blocklist });
        setSession(s);
        setView("sanctuary");
        await getCurrentWindow().setFullscreen(true).catch(() => {});
        const settings = await getSettings().catch(() => null);
        if (settings?.sound_enabled) playChime();
      } catch (e) {
        console.error(e);
      }
    },
    [draftConfig, setSession, setView]
  );

  const handleQuickStart = useCallback(async () => {
    const config = {
      ...DEFAULT_CONFIG,
      intent: "Quick 25-minute focus session",
      work_minutes: 25,
      break_minutes: 5,
      blocklist: draftConfig.blocklist,
      strictness: draftConfig.strictness,
      theme: draftConfig.theme,
    };
    await handleStart(config);
  }, [draftConfig, handleStart]);

  const handleEnd = useCallback(async () => {
    try {
      await endSession();
      setSession(IDLE_SESSION);
      setView("home");
      setShowOverlay(false);
      await getCurrentWindow().setFullscreen(false).catch(() => {});
      refreshMeta();
      const settings = await getSettings().catch(() => null);
      if (settings?.sound_enabled) playChime();
      if (settings) {
        await saveSettings({
          ...settings,
          last_preset: draftConfig,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [draftConfig, refreshMeta, setSession, setShowOverlay, setView]);

  useEffect(() => {
    refreshMeta();
    checkOllama().then(setOllamaAvailable).catch(() => {});
    getSettings()
      .then((s) => {
        setDraftConfig({
          ...DEFAULT_CONFIG,
          ...s.last_preset,
          blocklist: s.blocklist,
          strictness: s.default_strictness,
          theme: s.default_theme,
        });
      })
      .catch(() => {});

    const unlistenPromise = onBlockedApp((payload) => {
      setShowOverlay(true, payload.app_name);
      setShowDistractionJournal(true);
    });

    const trayUnlisten = onTrayQuickFocus(() => {
      handleQuickStart();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        handleQuickStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      unlistenPromise.then((fn) => fn());
      trayUnlisten.then((fn) => fn());
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    handleQuickStart,
    setShowOverlay,
    setShowDistractionJournal,
    setDraftConfig,
    setOllamaAvailable,
    refreshMeta,
  ]);

  useEffect(() => {
    if (session?.phase === "focus" || session?.phase === "break") {
      tickRef.current = window.setInterval(async () => {
        try {
          const s = await getSessionState();
          setSession(s);
        } catch {
          /* ignore */
        }
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [session?.phase, setSession]);

  const inSession =
    session &&
    session.phase !== "idle" &&
    session.phase !== "complete" &&
    (session.phase === "focus" ||
      session.phase === "break" ||
      session.phase === "paused");

  if (inSession && view === "sanctuary") {
    return (
      <>
        <SanctuaryView
          session={session}
          onPause={async () => setSession(await pauseSession())}
          onResume={async () => setSession(await resumeSession())}
          onEnd={handleEnd}
        />
        {showOverlay && (
          <BlockedOverlay
            strictness={session.config.strictness}
            intent={session.config.intent}
            onStay={() => setShowOverlay(false)}
            onOverride={handleEnd}
            onLogDistraction={async (tag) => {
              if (session.id) {
                setSession(await logDistraction(session.id, tag));
              }
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-full pb-20">
      {view === "home" && (
        <HomeView
          stats={stats}
          insights={insights}
          onStartFocus={() => setView("setup")}
          onQuickStart={handleQuickStart}
        />
      )}
      {view === "setup" && <SetupView onStart={() => handleStart()} />}
      {view === "settings" && <SettingsView />}
      {view === "stats" && <StatsView />}
      {!inSession && <Navigation current={view} onNavigate={setView} />}
    </div>
  );
}
