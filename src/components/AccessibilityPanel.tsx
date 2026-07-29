import React, { useEffect, useRef, useState } from "react";
import { Settings, Sun, Moon, Monitor, Type, Contrast, Zap, ZapOff, X, BookOpenText } from "lucide-react";
import { useAccessibility, FontSize, ThemeMode } from "./AccessibilityContext";

const FONT_SIZE_OPTIONS: { value: FontSize; sizeClass: string; aria: string }[] = [
  { value: "sm", sizeClass: "text-xs", aria: "Small text" },
  { value: "base", sizeClass: "text-sm", aria: "Default text size" },
  { value: "lg", sizeClass: "text-base", aria: "Large text" },
  { value: "xl", sizeClass: "text-lg", aria: "Extra large text" }
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: any }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor }
];

export default function AccessibilityPanel() {
  const {
    theme, setTheme,
    fontSize, setFontSize,
    highContrast, toggleHighContrast,
    reducedMotion, toggleReducedMotion,
    dyslexiaFont, toggleDyslexiaFont
  } = useAccessibility();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Open display and accessibility settings"
        aria-expanded={open}
        title="Display & accessibility settings"
        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
      >
        <Settings className="h-4.5 w-4.5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Display and accessibility settings"
          className="absolute right-0 mt-2 w-72 z-50 rounded-xl border border-slate-200 bg-white p-4 shadow-lg space-y-5 text-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-800">Display Settings</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close settings panel"
              className="text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Theme */}
          <fieldset className="space-y-1.5">
            <legend className="font-semibold text-slate-600 flex items-center gap-1.5 mb-1">
              <Sun className="h-3.5 w-3.5" /> Appearance
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {THEME_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = theme === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                      active
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Font Size */}
          <fieldset className="space-y-1.5">
            <legend className="font-semibold text-slate-600 flex items-center gap-1.5 mb-1">
              <Type className="h-3.5 w-3.5" /> Text Size
            </legend>
            <div className="grid grid-cols-4 gap-1.5">
              {FONT_SIZE_OPTIONS.map(opt => {
                const active = fontSize === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    aria-pressed={active}
                    aria-label={opt.aria}
                    className={`rounded-lg border py-2 font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${opt.sizeClass} ${
                      active
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    A
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <ToggleRow icon={Contrast} label="High contrast" checked={highContrast} onChange={toggleHighContrast} />
            <ToggleRow
              icon={reducedMotion ? ZapOff : Zap}
              label="Reduce motion"
              checked={reducedMotion}
              onChange={toggleReducedMotion}
            />
            <ToggleRow
              icon={BookOpenText}
              label="Dyslexia-friendly font"
              checked={dyslexiaFont}
              onChange={toggleDyslexiaFont}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-5 w-9 rounded-full transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
          checked ? "bg-emerald-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
