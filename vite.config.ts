import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  preview: {
    port: 8080,
    strictPort: false,
    host: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Gzip compression for production builds
    mode === 'production' && viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10KB
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression for production builds (better compression)
    mode === 'production' && viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer for performance auditing
    mode === 'production' && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Use Vite's default chunk splitting and module loading
    // This ensures proper dependency ordering and prevents "forwardRef of undefined" errors

    // Keep polyfill for older browsers
    modulePreload: {
      polyfill: true,
    },

    // Use esbuild for faster builds (Vite default)
    minify: 'esbuild',

    // Increase chunk size warning limit for large vendor bundles
    chunkSizeWarningLimit: 1000,

    // Enable CSS code splitting
    cssCodeSplit: true,
    cssMinify: true,

    // Enable source maps for debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
}));
