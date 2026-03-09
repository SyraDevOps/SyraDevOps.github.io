import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        diario: resolve(__dirname, 'diario.html'),
        notas: resolve(__dirname, 'notas.html'),
        timeline: resolve(__dirname, 'linha-do-tempo.html'),
        perfil: resolve(__dirname, 'perfil.html'),
        adesivos: resolve(__dirname, 'adesivos.html'),
        tests: resolve(__dirname, 'tests.html'),
      },
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        // Code splitting strategy
        manualChunks: (id) => {
          // Vendor chunks (if we add dependencies later)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          // Split by feature modules
          if (id.includes('drawing.js')) {
            return 'drawing';
          }
          if (id.includes('stickers.js') || id.includes('stickers-manager.js')) {
            return 'stickers';
          }
          if (id.includes('Sory.js')) {
            return 'ai';
          }
          if (id.includes('crypto-utils.js')) {
            return 'crypto';
          }
          if (id.includes('backup-utils.js')) {
            return 'backup';
          }
          
          // Core utilities stay in main bundle
          if (id.includes('utils.js') || id.includes('api-client.js') || id.includes('theme.js')) {
            return 'core';
          }
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api',
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    __BUILD_TIME__: JSON.stringify(Date.now()),
    __CACHE_VERSION__: JSON.stringify(`qd-web-${Date.now()}`),
  },
  optimizeDeps: {
    include: [], // We have no dependencies
  },
})
