import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const target = env.VITE_PROXY_TARGET || "http://localhost:5000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Proxying keeps the browser on ONE origin in development, so the API's
      // HttpOnly cookies work without any CORS / SameSite tweaking.
      proxy: {
        "/api": { target, changeOrigin: false },
        // Regex keys: a bare "/r" would also swallow /register and /reset-password.
        "^/r/": { target, changeOrigin: false },
        "^/health$": { target, changeOrigin: false },
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            charts: ["recharts"],
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
