import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Read .env / .env.local too (not only the shell), for settings used here rather than in the app.
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };

  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      // Same-origin API in development: the app calls /api/v1 and Vite forwards it to the backend,
      // so the httpOnly SameSite=Strict session cookie works without CORS. API_URL points it elsewhere.
      proxy: { "/api": env.API_URL || "http://localhost:5000" },
      allowedHosts: ["uninvited-suffice-depict.ngrok-free.dev"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
