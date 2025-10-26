import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Optimize HMR
    hmr: {
      overlay: true,
    },
  },
  // Performance hints
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
  ].filter(Boolean),
  // Enable esbuild optimization for faster builds
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Drop console/debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk size and splitting for faster initial load
    rollupOptions: {
      output: {
        // Manual chunk splitting optimized for initial page load performance
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            // OPTIMIZED: Split React ecosystem for better initial load performance
            // Phase 2: Separate core React from heavy UI libraries

            // CRITICAL: React core - MUST load first (highest priority)
            if (
              (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) &&
              !id.includes('@radix-ui') && !id.includes('@tanstack') && !id.includes('react-hook-form')
            ) {
              return 'vendor-react-core'; // ~150 KB - Critical path
            }

            // Radix UI - Large UI component library (loads after React core)
            if (id.includes('@radix-ui') ||
                // Radix UI transitive dependencies
                id.includes('aria-hidden') || id.includes('react-remove-scroll') ||
                id.includes('react-style-singleton') || id.includes('use-callback-ref') ||
                id.includes('use-sidecar')) {
              return 'vendor-radix'; // ~120 KB - Deferred priority
            }

            // State management - Can load in parallel with Radix
            if (id.includes('@tanstack/react-query') || id.includes('zustand') ||
                id.includes('use-sync-external-store')) {
              return 'vendor-state'; // ~80 KB - Parallel load
            }

            // Form libraries - Load when forms are needed
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'vendor-forms'; // ~60 KB - Parallel load
            }

            // React component libraries - Lower priority
            if (id.includes('react-aria') || id.includes('react-stately') ||
                id.includes('embla-carousel') || id.includes('cmdk') || id.includes('vaul') ||
                id.includes('next-themes') || id.includes('sonner') ||
                id.includes('react-day-picker') || id.includes('react-helmet') ||
                id.includes('react-resizable-panels') || id.includes('react-window') ||
                id.includes('input-otp')) {
              return 'vendor-react-components'; // ~80 KB - Lower priority
            }

            // CRITICAL: Supabase client - needed for auth on initial load
            if (id.includes('@supabase/supabase-js') || id.includes('@supabase/')) {
              return 'vendor-supabase';
            }

            // LAZY LOAD: Heavy visualization libraries (code-split for on-demand loading)
            // These are NOT in initial bundle - loaded only when component using them renders
            if (id.includes('reactflow')) {
              return 'lazy-reactflow';
            }

            if (id.includes('recharts') || id.includes('recharts/')) {
              return 'lazy-charts';
            }

            if (id.includes('html2canvas')) {
              return 'lazy-html2canvas';
            }

            // Utilities and smaller libraries (non-React)
            if (id.includes('lucide-react') || id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'vendor-utils';
            }

            // Validation library (non-React)
            if (id.includes('zod')) {
              return 'vendor-utils';
            }

            // Stripe (payment - lazy load)
            if (id.includes('@stripe')) {
              return 'vendor-stripe';
            }

            // Remaining vendor code (non-React, non-critical utilities)
            // FUTURE OPTIMIZATION: Further split this bundle if it grows beyond 300KB
            return 'vendor-misc';
          }
        },
        // Prioritize initial load chunks for faster rendering
        inlineDynamicImports: false,
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase chunk size warning limit (intentional chunking strategy)
    chunkSizeWarningLimit: 600,
    // Enable aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Prevent Safari 10 issues
      },
    },
    // CSS code splitting for faster initial load
    cssCodeSplit: true,
    // Reduce CSS chunk size
    cssMinify: true,
    // Enable source maps for production debugging (compressed)
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
  // Optimize dependency pre-bundling for faster dev server startup
  optimizeDeps: {
    // Force pre-bundle critical dependencies for faster initial load
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react', // Commonly used icons
      'date-fns', // Date utilities
    ],
    // Exclude heavy deps from pre-bundling - load on-demand for better initial performance
    exclude: [
      'html2canvas',      // 199 KB - Only used in ad creative/flowchart export
      'reactflow',        // Large - Only used in specific flowchart pages
      'recharts',         // 234 KB - Only used in dashboard/analytics charts
      '@stripe/stripe-js', // Lazy load payment processing
      'embla-carousel-react', // Lazy load carousel
    ],
    // Optimize dependency discovery
    entries: [
      'src/main.tsx',
      'src/App.tsx',
    ],
  },
}));
