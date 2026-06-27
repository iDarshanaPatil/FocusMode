import { useState } from "react";
import { Sparkles, Clock, Shield } from "lucide-react";
import { Button } from "../ui/Button";
import { PRESETS, THEMES } from "../../lib/utils";
import { useAppStore } from "../../stores/appStore";
import { refineIntent, checkOllama } from "../../lib/tauri";
import type { Strictness, TimerMode } from "../../types";

interface SetupViewProps {
  onStart: () => void;
}

export function SetupView({ onStart }: SetupViewProps) {
  const { draftConfig, setDraftConfig, ollamaAvailable, setOllamaAvailable } =
    useAppStore();
  const [refining, setRefining] = useState(false);

  const handleRefine = async () => {
    if (!draftConfig.intent.trim()) return;
    setRefining(true);
    try {
      const available = await checkOllama();
      setOllamaAvailable(available);
      if (available) {
        const refined = await refineIntent(draftConfig.intent);
        setDraftConfig({ intent: refined });
      }
    } catch {
      /* graceful fallback */
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Start a focus session</h1>
        <p className="text-slate-400 text-sm mt-1">
          Set your intent, then enter the sanctuary.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-slate-400">What are you focusing on?</label>
        <textarea
          value={draftConfig.intent}
          onChange={(e) => setDraftConfig({ intent: e.target.value })}
          placeholder="I'm focusing on ___ because ___"
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
        />
        {ollamaAvailable && (
          <Button variant="ghost" size="sm" onClick={handleRefine} disabled={refining}>
            <Sparkles className="w-4 h-4 mr-1" />
            {refining ? "Refining..." : "Refine with Ollama"}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Duration preset
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() =>
                setDraftConfig({ work_minutes: p.work, break_minutes: p.break })
              }
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                draftConfig.work_minutes === p.work
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                  : "border-white/10 hover:border-white/20 text-slate-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-500">Work (min)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={draftConfig.work_minutes}
              onChange={(e) =>
                setDraftConfig({ work_minutes: parseInt(e.target.value) || 25 })
              }
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500">Break (min)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={draftConfig.break_minutes}
              onChange={(e) =>
                setDraftConfig({ break_minutes: parseInt(e.target.value) || 5 })
              }
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Strictness
        </label>
        <div className="flex gap-2">
          {(["soft", "medium", "hard"] as Strictness[]).map((s) => (
            <button
              key={s}
              onClick={() => setDraftConfig({ strictness: s })}
              className={`flex-1 py-2 rounded-xl text-sm capitalize border ${
                draftConfig.strictness === s
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                  : "border-white/10 text-slate-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-slate-400">Sanctuary theme</label>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setDraftConfig({ theme: t.id })}
              className={`flex-1 py-3 rounded-xl text-sm border ${
                draftConfig.theme === t.id
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                  : "border-white/10 text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-slate-400">Timer mode</label>
        <div className="flex gap-2">
          {(["countdown", "count_up"] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setDraftConfig({ mode: m })}
              className={`flex-1 py-2 rounded-xl text-sm border ${
                draftConfig.mode === m
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-200"
                  : "border-white/10 text-slate-400"
              }`}
            >
              {m === "countdown" ? "Countdown" : "Count up"}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={onStart}>
        Enter sanctuary
      </Button>
    </div>
  );
}
