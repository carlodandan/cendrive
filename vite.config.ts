import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tauri points `devUrl` at a fixed port, so the dev server must not drift to
// another one, and it must not watch the Rust crate (cargo already does).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**", "**/dist/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // WebView2 is evergreen Chromium; no legacy transpilation needed.
    target: "chrome120",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
});
