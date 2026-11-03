const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        sunken: token("sunken"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        primary: token("primary"),
        "primary-ink": token("primary-ink"),
        "primary-soft": token("primary-soft"),
        accent: token("accent"),
        danger: token("danger"),
        "danger-soft": token("danger-soft"),
        success: token("success"),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Instrument Sans Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem" },
      keyframes: {
        "toast-in": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "none" } },
        "modal-in": { from: { opacity: 0, transform: "scale(.97)" }, to: { opacity: 1, transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "toast-in": "toast-in .18s ease-out",
        "modal-in": "modal-in .16s ease-out",
      },
    },
  },
  plugins: [],
};
