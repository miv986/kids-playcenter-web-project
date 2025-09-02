import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,               // escucha en todas las IPs
    port: 5173,
    strictPort: true,
    fs: {
      strict: false           // permite servir archivos fuera del root (node_modules)
    },
    hmr: {
      host: "localhost",      // o tu IP local si compartes en LAN
    },
    allowedHosts: ["e40fab29c858.ngrok-free.app"]       // permite cualquier host (como el de ngrok)
  }
});
