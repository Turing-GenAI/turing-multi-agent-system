import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert() // Add the mkcert plugin for HTTPS
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Expose to all network interfaces
    https: {}, // Empty object for HTTPS config (certificates handled by mkcert plugin)
    proxy: {
      '/api': {
        target: 'http://20.41.252.65:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
