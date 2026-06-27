import { motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import type { Strictness } from "../../types";
import { BreathingOverlay } from "./BreathingOverlay";
import { useState } from "react";

interface BlockedOverlayProps {
  strictness: Strictness;
  intent: string;
  onOverride: () => void;
  onStay: () => void;
  onLogDistraction: (tag: string) => void;
}

export function BlockedOverlay({
  strictness,
  intent,
  onOverride,
  onStay,
  onLogDistraction,
}: BlockedOverlayProps) {
  const { overlayApp, showDistractionJournal } = useAppStore();
  const [showBreathing, setShowBreathing] = useState(strictness === "soft");
  const [cooldown, setCooldown] = useState(strictness === "medium" ? 60 : 0);
  const [intentInput, setIntentInput] = useState("");
  const [cooldownActive, setCooldownActive] = useState(strictness === "medium");

  if (strictness === "hard") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      >
        <div className="glass p-10 max-w-lg text-center space-y-6">
          <Shield className="w-16 h-16 mx-auto text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Stay in the sanctuary</h2>
          <p className="text-slate-400">
            <span className="text-indigo-300 font-medium">{overlayApp}</span> is
            blocked during this session.
          </p>
          {intent && (
            <p className="text-sm text-slate-500 italic border-l-2 border-indigo-500 pl-4 text-left">
              &ldquo;{intent}&rdquo;
            </p>
          )}
          <p className="text-xs text-slate-600">Hard mode — session must complete first.</p>
          <button
            onClick={onStay}
            className="px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-colors"
          >
            Return to focus
          </button>
        </div>
      </motion.div>
    );
  }

  if (showBreathing) {
    return (
      <BreathingOverlay
        onCancel={onStay}
        onComplete={() => {
          setShowBreathing(false);
          if (strictness === "medium") {
            setCooldownActive(true);
            const interval = setInterval(() => {
              setCooldown((c) => {
                if (c <= 1) {
                  clearInterval(interval);
                  setCooldownActive(false);
                  return 0;
                }
                return c - 1;
              });
            }, 1000);
          }
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
    >
      <div className="glass p-8 max-w-lg w-full mx-4 space-y-5">
        <div className="flex justify-between items-start">
          <Shield className="w-10 h-10 text-amber-400" />
          <button onClick={onStay} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-white">Distraction detected</h2>
        <p className="text-slate-400 text-sm">
          You tried to open <span className="text-amber-300">{overlayApp}</span>
        </p>
        {intent && (
          <p className="text-sm text-slate-500 italic border-l-2 border-indigo-500 pl-3">
            Remember: {intent}
          </p>
        )}

        {showDistractionJournal && (
          <div className="flex flex-wrap gap-2">
            {["social", "phone", "hunger", "boredom", "anxiety", "other"].map((tag) => (
              <button
                key={tag}
                onClick={() => onLogDistraction(tag)}
                className="px-3 py-1 rounded-full text-xs bg-white/5 hover:bg-white/10 border border-white/10 capitalize"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {strictness === "medium" && cooldownActive && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Wait {cooldown}s, then type your intent to unlock:
            </p>
            <input
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="Type your session intent..."
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              disabled={cooldown > 0 || intentInput.trim() !== intent.trim()}
              onClick={onOverride}
              className="w-full py-2 rounded-xl bg-red-500/20 text-red-300 disabled:opacity-40 border border-red-500/30"
            >
              {cooldown > 0 ? `Unlock in ${cooldown}s` : "End focus session"}
            </button>
          </div>
        )}

        {strictness === "soft" && (
          <div className="flex gap-3">
            <button
              onClick={onStay}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium"
            >
              Stay focused
            </button>
            <button
              onClick={onOverride}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
            >
              Break focus
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
