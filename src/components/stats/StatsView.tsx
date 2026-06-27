import { useEffect, useState } from "react";
import { formatTime } from "../../lib/utils";
import { getSessionHistory, getStats, getInsights } from "../../lib/tauri";
import type { SessionRecord, StatsSummary, Insights } from "../../types";

export function StatsView() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    getSessionHistory().then(setHistory).catch(console.error);
    getStats().then(setStats).catch(console.error);
    getInsights().then(setInsights).catch(console.error);
  }, []);

  const maxWeek = Math.max(...(insights?.weekly_minutes ?? [1]), 1);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-semibold text-white">Focus stats</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-5">
            <div className="text-3xl font-bold text-orange-400">{stats.streak_days}</div>
            <div className="text-sm text-slate-500">Day streak</div>
          </div>
          <div className="glass p-5">
            <div className="text-3xl font-bold text-indigo-400">{stats.today_minutes}</div>
            <div className="text-sm text-slate-500">Minutes today</div>
          </div>
        </div>
      )}

      {insights && insights.weekly_minutes.length > 0 && (
        <div className="glass p-6 space-y-4">
          <h2 className="text-sm font-medium text-slate-300">This week</h2>
          <div className="flex items-end gap-2 h-32">
            {insights.weekly_minutes.map((mins, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-indigo-500/60 rounded-t-md transition-all"
                  style={{ height: `${(mins / maxWeek) * 100}%`, minHeight: mins > 0 ? 4 : 0 }}
                />
                <span className="text-[10px] text-slate-600">{mins}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights && insights.top_distractions.length > 0 && (
        <div className="glass p-6 space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Distraction map</h2>
          {insights.top_distractions.map((tag, i) => (
            <div key={tag} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-4">#{i + 1}</span>
              <span className="capitalize text-amber-300/90">{tag}</span>
            </div>
          ))}
        </div>
      )}

      <div className="glass p-6 space-y-3">
        <h2 className="text-sm font-medium text-slate-300">Recent sessions</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">No sessions yet. Start focusing!</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">
                    {s.intent || "Focus session"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {new Date(s.started_at).toLocaleDateString()} · score {s.focus_score}
                  </p>
                </div>
                <div className="text-sm text-slate-400 tabular-nums ml-4">
                  {formatTime(s.duration_seconds)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
