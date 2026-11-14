import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    // Same-origin API in development: the httpOnly SameSite=Strict session cookie just works.
    // Set API_URL to point at a backend on another port.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:5000' },
  },
})
