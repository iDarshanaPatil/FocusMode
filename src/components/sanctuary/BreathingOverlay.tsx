import { motion } from "framer-motion";

interface BreathingOverlayProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function BreathingOverlay({ onComplete, onCancel }: BreathingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="glass p-10 max-w-md text-center space-y-6">
        <h2 className="text-xl font-semibold text-white">Take a breath</h2>
        <p className="text-slate-400 text-sm">
          4-7-8 breathing before you switch away
        </p>
        <motion.div
          animate={{ scale: [1, 1.4, 1.4, 1], opacity: [0.6, 1, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 mx-auto rounded-full bg-indigo-500/30 border-2 border-indigo-400/50 flex items-center justify-center"
        >
          <span className="text-indigo-200 text-sm">breathe</span>
        </motion.div>
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            Stay focused
          </button>
          <button
            onClick={onComplete}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </motion.div>
  );
}
