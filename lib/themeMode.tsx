"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ThemeMode } from "@hwangchongmu/ui";

const STORAGE_KEY = "hwang-theme-mode";

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "light",
  setMode: () => {},
  toggleMode: () => {},
});

interface ThemeModeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeModeProvider({
  children,
  defaultMode = "light",
}: ThemeModeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  // 마운트 후 localStorage에서 복원 (SSR hydration mismatch 회피)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      setModeState(saved);
      return;
    }
    // 저장된 값이 없으면 시스템 prefers-color-scheme 따름
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setModeState(prefersDark ? "dark" : "light");
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
