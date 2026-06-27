import { Home, Settings, BarChart3, Moon } from "lucide-react";
import { cn } from "../../lib/utils";
import type { View } from "../../types";

interface NavProps {
  current: View;
  onNavigate: (view: View) => void;
}

const items: { view: View; icon: typeof Home; label: string }[] = [
  { view: "home", icon: Home, label: "Home" },
  { view: "stats", icon: BarChart3, label: "Stats" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export function Navigation({ current, onNavigate }: NavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-6 py-3 flex items-center justify-between z-40">
      <div className="flex items-center gap-2 text-indigo-300">
        <Moon className="w-5 h-5" />
        <span className="font-semibold text-sm hidden sm:inline">FocusMode</span>
      </div>
      <div className="flex gap-1">
        {items.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors",
              current === view
                ? "bg-indigo-500/20 text-indigo-200"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
