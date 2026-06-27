import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "../ui/Button";
import { listInstalledApps, getSettings, saveSettings } from "../../lib/tauri";
import type { AppSettings } from "../../types";
import { DEFAULT_CONFIG } from "../../types";

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [newApp, setNewApp] = useState("");
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
    listInstalledApps()
      .then((apps) => setInstalledApps(apps.map((a) => a.name)))
      .catch(console.error);
  }, []);

  const update = async (partial: Partial<AppSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(next);
  };

  const addToBlocklist = () => {
    if (!settings || !newApp.trim()) return;
    if (!settings.blocklist.includes(newApp.trim())) {
      update({ blocklist: [...settings.blocklist, newApp.trim()] });
    }
    setNewApp("");
  };

  const removeFromBlocklist = (app: string) => {
    if (!settings) return;
    update({ blocklist: settings.blocklist.filter((a) => a !== app) });
  };

  if (!settings) {
    return <div className="p-8 text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Daily goal</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={30}
            max={480}
            value={settings.daily_goal_minutes}
            onChange={(e) =>
              update({ daily_goal_minutes: parseInt(e.target.value) || 120 })
            }
            className="w-24 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
          />
          <span className="text-slate-400 text-sm">minutes per day</span>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Blocked apps</h2>
        <div className="flex flex-wrap gap-2">
          {settings.blocklist.map((app) => (
            <span
              key={app}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-500/10 border border-red-500/20 text-red-200"
            >
              {app}
              <button onClick={() => removeFromBlocklist(app)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            list="installed-apps"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            placeholder="App name..."
            className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
          />
          <datalist id="installed-apps">
            {installedApps.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
          <Button size="sm" onClick={addToBlocklist}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Preferences</h2>
        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Session sounds</span>
          <input
            type="checkbox"
            checked={settings.sound_enabled}
            onChange={(e) => update({ sound_enabled: e.target.checked })}
            className="rounded"
          />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Trigger Focus Mode (Shortcuts)
          </span>
          <input
            type="checkbox"
            checked={settings.dnd_enabled}
            onChange={(e) => update({ dnd_enabled: e.target.checked })}
            className="rounded"
          />
        </label>
        <p className="text-xs text-slate-600">
          Cmd+Shift+F — quick start last preset from anywhere (when app is running)
        </p>
      </div>

      <Button
        variant="secondary"
        onClick={() =>
          update({ last_preset: DEFAULT_CONFIG, blocklist: DEFAULT_CONFIG.blocklist })
        }
      >
        Reset to defaults
      </Button>
    </div>
  );
}
