import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "sm" | "base" | "lg" | "xl";

interface AccessibilitySettings {
  theme: ThemeMode;
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
}

interface AccessibilityContextValue extends AccessibilitySettings {
  resolvedTheme: "light" | "dark";
  setTheme: (t: ThemeMode) => void;
  setFontSize: (f: FontSize) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleDyslexiaFont: () => void;
}

const STORAGE_KEY = "servicehub_accessibility_settings";

const defaultSettings: AccessibilitySettings = {
  theme: "system",
  fontSize: "base",
  highContrast: false,
  reducedMotion: false,
  dyslexiaFont: false
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Could not load accessibility settings", e);
  }
  return defaultSettings;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Track OS-level theme changes for "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // On first-ever visit (no saved prefs yet), respect the OS reduced-motion preference
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) setSettings(prev => ({ ...prev, reducedMotion: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedTheme: "light" | "dark" =
    settings.theme === "system" ? (systemPrefersDark ? "dark" : "light") : settings.theme;

  // Persist settings + apply classes to <html> so plain CSS can react to them
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduce-motion", settings.reducedMotion);
    root.classList.toggle("dyslexia-font", settings.dyslexiaFont);

    root.classList.remove("font-sm", "font-base", "font-lg", "font-xl");
    root.classList.add(`font-${settings.fontSize}`);
  }, [settings, resolvedTheme]);

  const setTheme = useCallback((theme: ThemeMode) => setSettings(prev => ({ ...prev, theme })), []);
  const setFontSize = useCallback((fontSize: FontSize) => setSettings(prev => ({ ...prev, fontSize })), []);
  const toggleHighContrast = useCallback(() => setSettings(prev => ({ ...prev, highContrast: !prev.highContrast })), []);
  const toggleReducedMotion = useCallback(() => setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion })), []);
  const toggleDyslexiaFont = useCallback(() => setSettings(prev => ({ ...prev, dyslexiaFont: !prev.dyslexiaFont })), []);

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        resolvedTheme,
        setTheme,
        setFontSize,
        toggleHighContrast,
        toggleReducedMotion,
        toggleDyslexiaFont
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within an AccessibilityProvider");
  return ctx;
}
