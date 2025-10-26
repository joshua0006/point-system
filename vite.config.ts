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
            // CRITICAL: React ecosystem - bundle ALL React-dependent libraries together
            // This prevents createContext, useLayoutEffect, and other hook race conditions
            // ALL libraries using ANY React APIs must be in this single chunk to ensure
            // React initializes before any library tries to use its APIs
            if (
              // React core
              id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler') ||
              // Radix UI - uses createContext extensively
              id.includes('@radix-ui') ||
              // React Aria/Stately - accessibility primitives using React context
              id.includes('react-aria') || id.includes('react-stately') ||
              // UI utilities that depend on React context
              id.includes('embla-carousel') || id.includes('cmdk') || id.includes('vaul') ||
              // Theme and toast providers - use createContext
              id.includes('next-themes') || id.includes('sonner') ||
              // React component libraries
              id.includes('react-day-picker') || id.includes('react-helmet') ||
              id.includes('react-resizable-panels') || id.includes('react-window') ||
              id.includes('input-otp') ||
              // CRITICAL: State management - uses React hooks
              id.includes('@tanstack/react-query') || id.includes('zustand') ||
              // CRITICAL: Form libraries - react-hook-form uses useLayoutEffect
              id.includes('react-hook-form') || id.includes('@hookform') ||
              // CRITICAL: React utility libraries (transitive deps from Radix UI)
              // These use React hooks and MUST load with React
              id.includes('aria-hidden') || id.includes('react-remove-scroll') ||
              id.includes('react-style-singleton') || id.includes('use-sync-external-store') ||
              id.includes('use-callback-ref') || id.includes('use-sidecar')
            ) {
              return 'vendor-react';
            }

            // CRITICAL: Supabase client - needed for auth on initial load
            if (id.includes('@supabase/supabase-js') || id.includes('@supabase/')) {
              return 'vendor-supabase';
            }

            // LAZY LOAD: Heavy visualization libraries
            if (id.includes('reactflow')) {
              return 'vendor-reactflow';
            }

            if (id.includes('recharts') || id.includes('recharts/')) {
              return 'vendor-charts';
            }

            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
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

            // All other vendor code
            return 'vendor-misc';
          }
        },
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
    // Exclude heavy deps from pre-bundling - these will be lazy loaded
    exclude: [
      'html2canvas',
      'reactflow',
      'recharts',
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
