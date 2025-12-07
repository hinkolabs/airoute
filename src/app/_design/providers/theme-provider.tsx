"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "day" | "night";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "airoute-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to "day" theme - no dark flash on first load
  const [theme, setTheme] = useState<Theme>(() => {
    // Server-side or first render: default to "day"
    if (typeof window === "undefined") return "day";
    // Client-side: check localStorage
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "day" || stored === "night") return stored as Theme;
    return "day";
  });

  // Sync theme to localStorage when it changes
  // (removed the initial load effect since we now use lazy initializer)

  // theme 변경 시 html data-theme + localStorage 동기화
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "day" ? "night" : "day"));
  };

  const value: ThemeContextValue = { theme, toggleTheme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

