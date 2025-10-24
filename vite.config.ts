import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk size and splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and performance
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // Heavy visualization libraries - separate chunks for lazy loading
            if (id.includes('reactflow')) {
              return 'vendor-reactflow';
            }

            if (id.includes('recharts')) {
              return 'vendor-charts';
            }

            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }

            // Supabase and data fetching (separate from React to allow independent caching)
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'vendor-data';
            }

            // All other vendor code (React, UI libs, utilities) - bundled together
            // to prevent module initialization race conditions
            return 'vendor';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase chunk size warning limit (we're splitting intentionally)
    chunkSizeWarningLimit: 600,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: [
      'html2canvas', // Exclude heavy deps from pre-bundling for lazy loading
      'reactflow',
    ],
  },
}));
