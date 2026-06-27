import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export const DISTRACTION_TAGS = [
  "social",
  "phone",
  "hunger",
  "boredom",
  "anxiety",
  "other",
] as const;

export const PRESETS = [
  { label: "Pomodoro 25/5", work: 25, break: 5 },
  { label: "Deep Work 50/10", work: 50, break: 10 },
  { label: "Quick 15/3", work: 15, break: 3 },
] as const;

export const THEMES = [
  { id: "midnight", label: "Midnight", class: "theme-midnight" },
  { id: "forest", label: "Forest", class: "theme-forest" },
  { id: "ocean", label: "Deep Ocean", class: "theme-ocean" },
] as const;
