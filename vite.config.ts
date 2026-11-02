import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Text is translated as elements are created on second-language pages (client/src/i18n-jsx)
  plugins: [react({ jsxImportSource: "@yp-i18n" })],
  resolve: {
    alias: {
      "@yp-i18n/jsx-runtime": path.resolve(import.meta.dirname, "client", "src", "i18n-jsx", "jsx-runtime.ts"),
      "@yp-i18n/jsx-dev-runtime": path.resolve(import.meta.dirname, "client", "src", "i18n-jsx", "jsx-dev-runtime.ts"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // Remove debug-only logging from shipped code; keep warnings and errors.
  esbuild: {
    pure: ["console.log", "console.debug"],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
