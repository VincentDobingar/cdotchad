// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  css: {
    postcss: './postcss.config.cjs',
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/backend': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/backend/, ''),
      },
    },
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // (optionnel) cible raisonnable
    target: 'es2019',
    rollupOptions: {
      output: {
        // ✅ noms hashés pour invalider le cache à chaque build
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          // garde l’extension d’origine
          const ext = name ? name.substring(name.lastIndexOf('.')) : '';
          return `assets/[name]-[hash]${ext}`;
        },
        // ✅ tes chunks personnalisés
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          ui: ["react-toastify", "framer-motion", "lucide-react"],
          data: ["axios", "jwt-decode", "papaparse"],
          pdf: ["jspdf", "jspdf-autotable", "html2canvas"],
          charts: ["recharts"],
          swiper: ["swiper"],
          modals: ["react-modal"],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-toastify',
      'framer-motion',
      'lucide-react',
      'react-modal',
      'axios',
      'jwt-decode',
      'swiper',
      'recharts',
    ],
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
});
