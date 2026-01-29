import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Use base path only in production/build, not in development
  base: process.env.NODE_ENV === 'production' ? "/LegalAid-Connect/" : "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // Polyfill for Node.js global variable (required by sockjs-client)
    global: 'globalThis',
  },
  server: {
    // For client-side routing with BrowserRouter
    // Vite handles this automatically, but we can be explicit
    strictPort: false,
  },
})
