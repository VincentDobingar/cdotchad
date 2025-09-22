import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Configuration spécifique au build (production)
  base: '/', // Crucial pour cPanel
  server: {
    proxy: {
      '/api': {
        target: 'https://cdotchad.com',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist', // Dossier de build
    emptyOutDir: true,
  },
  // Supprimez toute configuration 'server' et 'proxy' en production
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
});