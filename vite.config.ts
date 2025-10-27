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
    // Enable modulePreload for critical vendor chunks
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) => {
        // Preload all critical vendor chunks in correct dependency order
        // CRITICAL PATH: vendor-react-core → vendor-styling → vendor-radix → vendor-router
        // This prevents "useLayoutEffect of undefined" errors from race conditions
        return deps.filter(dep =>
          dep.includes('vendor-react-core') ||    // React core - CRITICAL (always needed)
          dep.includes('vendor-styling') ||       // CSS utilities - CRITICAL (used everywhere)
          dep.includes('vendor-radix') ||         // Radix UI - HIGH PRIORITY (used in most routes)
          dep.includes('vendor-router') ||        // React Router - CRITICAL (routing)
          dep.includes('vendor-query') ||         // React Query - HIGH PRIORITY (data fetching)
          dep.includes('vendor-ui-components')    // UI components - MEDIUM PRIORITY
        );
      },
    },
    rollupOptions: {
      output: {
        // Optimized automatic chunk splitting - FULLY AUTOMATIC with exceptions
        // Let Vite's rollup algorithm handle all vendor splitting intelligently
        // Only specify lazy-loaded heavy libraries to ensure they're code-split
        manualChunks: (id) => {
          // PERFORMANCE FIX: Do NOT bundle icons barrel file into vendor-react-core
          // Let Vite tree-shake icons per-route for optimal bundle splitting
          // Each lazy-loaded route will include only the icons it actually uses

          if (id.includes('node_modules')) {
            // Lazy-loaded visualization libraries (check FIRST to avoid bundling with React)
            if (id.includes('reactflow')) {
              return 'lazy-reactflow';
            }
            if (id.includes('recharts')) {
              return 'lazy-charts';
            }
            if (id.includes('html2canvas')) {
              return 'lazy-html2canvas';
            }

            // React Router - separate for optimal caching (check BEFORE React catch-all)
            if (id.includes('react-router')) {
              return 'vendor-router';
            }

            // TanStack React Query - separate (check BEFORE React catch-all)
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }

            // PERFORMANCE OPTIMIZATION: Split large vendor-react-core into semantic chunks
            // This reduces initial bundle from 661KB to ~150KB critical path

            // Radix UI components - separate chunk for better caching (~200KB)
            // Update frequency: Low (UI library updates are infrequent)
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }

            // Styling utilities - separate chunk (~15KB)
            // Update frequency: Very low (stable utility libraries)
            if (id.includes('class-variance-authority') ||
                id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-styling';
            }

            // UI components - separate chunk (~50KB)
            // Update frequency: Medium (toast/dialog libraries update occasionally)
            if (id.includes('sonner') || id.includes('cmdk') || id.includes('vaul')) {
              return 'vendor-ui-components';
            }

            // Carousel - lazy-loaded chunk (not needed on initial load)
            // Most routes don't use carousel, load on-demand
            if (id.includes('embla-carousel')) {
              return 'lazy-carousel';
            }

            // React Core - minimal essential chunk (~150KB)
            // Update frequency: High (React updates regularly)
            // Contains: react, react-dom, scheduler, next-themes
            if (id.includes('/react') || id.includes('/react-') ||
                id.includes('scheduler') || id.includes('next-themes')) {
              return 'vendor-react-core';
            }

            // lucide-react: Bundle into dedicated vendor-icons chunk
            // Prevents 50+ tiny icon chunks (HTTP/2 overhead)
            // Icons barrel file already limits to ~113 icons = ~45 KB total
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            // Form libraries ecosystem (zod is React-independent, others caught by React catch-all)
            if (id.includes('zod') || id.includes('@hookform') || id.includes('input-otp')) {
              return 'vendor-forms';
            }

            // Supabase - API client (React-independent)
            if (id.includes('@supabase/')) {
              return 'vendor-supabase';
            }

            // Date utilities (date-fns is React-independent, react-day-picker caught by React catch-all)
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }

            // Everything else - bundle with React to avoid race conditions
            // This ensures all unidentified dependencies load with React
            // Prevents "useLayoutEffect of undefined" errors
            return 'vendor-react-core';
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
