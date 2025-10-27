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
        // Preload all vendor chunks in correct dependency order
        // vendor-utils depends on vendor-react-core, so both must be preloaded
        // This prevents "useLayoutEffect of undefined" errors from race conditions
        return deps.filter(dep =>
          dep.includes('vendor-react-core') ||
          dep.includes('vendor-router') ||
          dep.includes('vendor-query') ||
          dep.includes('vendor-utils')
        );
      },
    },
    rollupOptions: {
      output: {
        // Optimized automatic chunk splitting - FULLY AUTOMATIC with exceptions
        // Let Vite's rollup algorithm handle all vendor splitting intelligently
        // Only specify lazy-loaded heavy libraries to ensure they're code-split
        manualChunks: (id) => {
          // CRITICAL FIX: Icon barrel file MUST be bundled with vendor-react-core
          // The barrel file re-exports from lucide-react, so it depends on React
          // If bundled separately, it causes "useLayoutEffect of undefined" errors
          if (id.includes('src/lib/icons')) {
            return 'vendor-react-core';
          }

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

            // React Core + ALL libraries with "react" in the path
            // This is the ONLY way to guarantee no race conditions
            // Catches: react, react-dom, @radix-ui/react-*, lucide-react,
            //          sonner, vaul, cmdk, react-aria, react-helmet, etc.
            if (id.includes('/react') || id.includes('/react-') ||
                id.includes('@radix-ui') || id.includes('scheduler') ||
                id.includes('lucide-react') ||
                id.includes('class-variance-authority') ||
                id.includes('clsx') || id.includes('tailwind-merge') ||
                id.includes('sonner') || id.includes('cmdk') || id.includes('vaul') ||
                id.includes('next-themes') || id.includes('embla-carousel')) {
              return 'vendor-react-core';
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
