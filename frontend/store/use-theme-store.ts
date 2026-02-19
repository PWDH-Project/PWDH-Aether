import { create } from "zustand";

export const ACCENT_COLORS = {
  cyan: { name: "Cyan", value: "#00f0ff", hsl: "185 100% 50%" },
  green: { name: "Neon Gruen", value: "#39ff14", hsl: "110 100% 54%" },
  magenta: { name: "Magenta", value: "#ff00ff", hsl: "300 100% 50%" },
  orange: { name: "Orange", value: "#ff6600", hsl: "24 100% 50%" },
  purple: { name: "Lila", value: "#a855f7", hsl: "271 91% 65%" },
  red: { name: "Rot", value: "#ef4444", hsl: "0 84% 60%" },
  blue: { name: "Blau", value: "#3b82f6", hsl: "217 91% 60%" },
  yellow: { name: "Gelb", value: "#facc15", hsl: "48 97% 53%" },
} as const;

export type AccentKey = keyof typeof ACCENT_COLORS;

interface ThemeState {
  accent: AccentKey;
  streamerMode: boolean;
  setAccent: (accent: AccentKey) => void;
  toggleStreamerMode: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  accent: (typeof window !== "undefined" ? localStorage.getItem("accent") as AccentKey : null) || "cyan",
  streamerMode: false,

  setAccent: (accent) => {
    localStorage.setItem("accent", accent);
    set({ accent });
  },

  toggleStreamerMode: () => {
    set((s) => ({ streamerMode: !s.streamerMode }));
  },
}));
