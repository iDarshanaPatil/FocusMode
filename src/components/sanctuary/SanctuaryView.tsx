import { motion } from "framer-motion";
import { Pause, Play, Square, Target } from "lucide-react";
import { formatTime, THEMES } from "../../lib/utils";
import { Button } from "../ui/Button";
import type { SessionState } from "../../types";

interface SanctuaryViewProps {
  session: SessionState;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export function SanctuaryView({
  session,
  onPause,
  onResume,
  onEnd,
}: SanctuaryViewProps) {
  const theme = THEMES.find((t) => t.id === session.config.theme) ?? THEMES[0];
  const displaySeconds =
    session.config.mode === "countdown"
      ? session.remaining_seconds
      : session.elapsed_seconds;
  const isPaused = session.phase === "paused";
  const phaseLabel =
    session.phase === "break"
      ? "Break time"
      : isPaused
        ? "Paused"
        : "Deep focus";

  return (
    <div
      className={`min-h-full flex flex-col items-center justify-center p-8 ${theme.class}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-2xl w-full"
      >
        <div className="space-y-2">
          <p className="text-indigo-300/80 text-sm uppercase tracking-widest font-medium">
            {phaseLabel}
          </p>
          {session.config.intent && (
            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              {session.config.intent}
            </p>
          )}
        </div>

        <motion.div
          animate={
            session.remaining_seconds <= 60 &&
            session.config.mode === "countdown" &&
            session.phase === "focus"
              ? { scale: [1, 1.02, 1] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-[7rem] md:text-[9rem] font-light tabular-nums tracking-tight text-white leading-none">
            {formatTime(displaySeconds)}
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span>Round {session.current_round}</span>
          <span>Score {session.focus_score}</span>
          {session.distraction_count > 0 && (
            <span className="text-amber-400/80">
              {session.distraction_count} distractions
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          {isPaused ? (
            <Button size="lg" onClick={onResume}>
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={onPause}>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={onEnd}>
            <Square className="w-4 h-4 mr-2" />
            End session
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
