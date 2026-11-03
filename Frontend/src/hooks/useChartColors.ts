import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const read = () => {
  const css = getComputedStyle(document.documentElement);
  const rgb = (name: string) => `rgb(${css.getPropertyValue(`--c-${name}`).trim().split(/\s+/).join(",")})`;
  return {
    primary: rgb("primary"),
    accent: rgb("accent"),
    muted: rgb("muted"),
    line: rgb("line"),
    surface: rgb("surface"),
    ink: rgb("ink"),
  };
};

/** Recharts needs concrete colour strings, so we read the CSS variables whenever the theme changes. */
export function useChartColors() {
  const { theme } = useTheme();
  const [colors, setColors] = useState(read);
  useEffect(() => setColors(read()), [theme]);
  return colors;
}
