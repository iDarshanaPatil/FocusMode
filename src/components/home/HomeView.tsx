import { Flame, Play, TrendingUp, Target } from "lucide-react";
import { Button } from "../ui/Button";
import type { StatsSummary, Insights } from "../../types";

interface HomeViewProps {
  stats: StatsSummary | null;
  insights: Insights | null;
  onStartFocus: () => void;
  onQuickStart: () => void;
}

export function HomeView({
  stats,
  insights,
  onStartFocus,
  onQuickStart,
}: HomeViewProps) {
  const progress = stats
    ? Math.min(100, (stats.today_minutes / stats.daily_goal_minutes) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">FocusMode</h1>
        <p className="text-slate-400">Your focus sanctuary awaits.</p>
      </div>

      {stats && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{stats.streak_days} day streak</span>
            </div>
            <span className="text-sm text-slate-400">
              {stats.today_minutes} / {stats.daily_goal_minutes} min today
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="flex-1" onClick={onQuickStart}>
          <Play className="w-5 h-5 mr-2" />
          Quick focus (25 min)
        </Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={onStartFocus}>
          <Target className="w-5 h-5 mr-2" />
          Custom session
        </Button>
      </div>

      {insights && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-300">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-semibold">Your patterns</h2>
          </div>
          {insights.best_hours.length > 0 ? (
            <p className="text-sm text-slate-400">
              Best focus hours:{" "}
              <span className="text-white">{insights.best_hours.join(", ")}</span>
              <span className="text-slate-600 text-xs block mt-1">
                Based on when you log the most focus minutes (local time)
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Complete sessions of at least 1 minute to discover your best focus hours.
            </p>
          )}
          {insights.suggested_session_minutes > 0 && (
            <p className="text-sm text-slate-400">
              Suggested session:{" "}
              <span className="text-white">
                {insights.suggested_session_minutes} minutes
              </span>
            </p>
          )}
          {insights.top_distractions.length > 0 && (
            <p className="text-sm text-slate-400">
              Top distractions:{" "}
              <span className="text-amber-300 capitalize">
                {insights.top_distractions.join(", ")}
              </span>
            </p>
          )}
        </div>
      )}

      {stats && stats.total_sessions > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total_sessions}</div>
            <div className="text-xs text-slate-500 mt-1">Sessions</div>
          </div>
          <div className="glass p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {stats.total_focus_minutes}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total min</div>
          </div>
          <div className="glass p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {Math.round(stats.avg_focus_score)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Avg score</div>
          </div>
        </div>
      )}
    </div>
  );
}
