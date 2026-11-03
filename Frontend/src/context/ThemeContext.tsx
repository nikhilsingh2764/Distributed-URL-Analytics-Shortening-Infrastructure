import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
interface ThemeValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const STORAGE_KEY = "trimly-theme";

const initialTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage can be blocked; the theme still applies for this session */
    }
  }, [theme]);

  const toggle = useCallback(
    () =>
      setTheme((t) => {
        const next: Theme = t === "dark" ? "light" : "dark";
        // Apply the class right away so children that read CSS variables (charts) see the new colours.
        document.documentElement.classList.toggle("dark", next === "dark");
        return next;
      }),
    [],
  );
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
