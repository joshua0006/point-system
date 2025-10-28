import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import viteCompression from 'vite-plugin-compression';
import type { Plugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * Custom Vite plugin to defer CSS loading for improved FCP (First Contentful Paint)
 *
 * PERFORMANCE OPTIMIZATION: Applies media="print" trick to main CSS bundle
 * - Loads CSS asynchronously to avoid render-blocking
 * - Switches to media="all" once loaded
 * - Expected improvement: 250-400ms faster FCP
 *
 * Background: Vite auto-injects CSS in <head> as render-blocking by default.
 * This plugin modifies the generated HTML to defer CSS loading.
 */
function deferCSSPlugin(): Plugin {
  return {
    name: 'defer-css-plugin',
    enforce: 'post',
    transformIndexHtml(html) {
      // Only apply in production builds
      if (process.env.NODE_ENV !== 'production') return html;

      // Find all stylesheet links in the <head> section
      // Match: <link rel="stylesheet" ... href="/assets/index-*.css">
      const cssLinkRegex = /<link\s+rel="stylesheet"[^>]*href="\/assets\/index-[^"]+\.css"[^>]*>/gi;

      const matches = html.match(cssLinkRegex);
      if (!matches) return html;

      // Transform each CSS link to use async loading with media="print" trick
      matches.forEach(match => {
        // Skip if already has media attribute (likely already deferred)
        if (match.includes('media=')) return;

        // Extract href attribute
        const hrefMatch = match.match(/href="([^"]+)"/);
        if (!hrefMatch) return;

        const href = hrefMatch[1];
        const crossorigin = match.includes('crossorigin') ? ' crossorigin' : '';

        // Create deferred CSS link with media="print" trick
        // After load, switch media to "all" and remove onload handler
        const deferredLink = `<link rel="stylesheet"${crossorigin} href="${href}" media="print" onload="this.media='all'; this.onload=null;">`;

        // Add noscript fallback for browsers with JS disabled
        const noscriptFallback = `<noscript><link rel="stylesheet"${crossorigin} href="${href}"></noscript>`;

        // Replace original render-blocking link with deferred version + fallback
        html = html.replace(match, `${deferredLink}\n    ${noscriptFallback}`);
      });

      return html;
    },
  };
}

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
    // Defer CSS loading for improved FCP (250-400ms improvement)
    mode === 'production' && deferCSSPlugin(),
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
        // PERFORMANCE: Preload ONLY critical path chunks to minimize initial load
        // Lovable deployment optimization: reduce waterfall, maximize parallel loading
        //
        // CRITICAL PATH (loaded immediately):
        // 1. vendor-react-core (~155KB) - React + ReactDOM + internals (scheduler, react-is, etc.)
        // 2. vendor-router (~14KB) - React Router for routing
        // 3. vendor-styling (~21KB) - Tailwind utilities (FOUC prevention)
        // 4. vendor-theme (~1.5KB) - Dark mode support (FOUC prevention)
        //
        // SEMI-CRITICAL (preload hint, but not blocking):
        // 5. vendor-radix-critical (~21KB) - Dialog, Popover, Dropdown
        // 6. vendor-query (~2.6KB) - React Query core
        // 7. vendor-radix-forms (~29KB) - Select, Checkbox, Radio, Slider, Switch
        // 8. vendor-radix-layout (~23KB) - Accordion, Tabs, Collapsible, Separator
        // 9. vendor-radix-misc (~59KB) - All other Radix UI components
        // 10. vendor-ui-components (~127KB) - Toast, Drawer, Forms, Date Picker, Aria
        //
        // LAZY (loaded on-demand):
        // - vendor-date, vendor-forms (non-React utilities)
        //
        // Total critical path: ~364KB (ALL React-dependent code to prevent loading errors)
        return deps.filter(dep =>
          // Tier 1: React core (CRITICAL - must load first)
          dep.includes('vendor-react-core') ||

          // Tier 2: Routing (CRITICAL - needed for navigation)
          dep.includes('vendor-router') ||

          // Tier 3: Styling (CRITICAL - prevents FOUC)
          dep.includes('vendor-styling') ||
          dep.includes('vendor-theme') ||

          // Tier 4: Common UI primitives (SEMI-CRITICAL)
          dep.includes('vendor-radix-critical') ||
          dep.includes('vendor-query') ||

          // Tier 5: CRITICAL Radix UI bundles only (MUST load after React)
          // Prevents "forwardRef of undefined" errors
          // PERFORMANCE FIX: Exclude vendor-radix-misc from preload to fix module loading order
          // vendor-radix-misc is "lowest priority" and should load on-demand, not preloaded
          dep.includes('vendor-radix-forms') ||
          dep.includes('vendor-radix-layout') ||

          // Tier 6: React-dependent UI components (MUST load after React)
          // Prevents "useLayoutEffect of undefined" errors
          dep.includes('vendor-ui-components')
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

            // React Router - separate for optimal caching (check BEFORE React catch-all)
            if (id.includes('react-router')) {
              return 'vendor-router';
            }

            // TanStack React Query - separate (check BEFORE React catch-all)
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }

            // PERFORMANCE OPTIMIZATION: Balanced vendor splitting for Lovable deployment
            // Target: Reduce critical path from 456KB → ~215KB (53% reduction)
            //
            // CRITICAL: React internals MUST load together atomically
            // React Core + Internals - atomic chunk (~155KB)
            // Contains: react, react-dom, scheduler, react-is, use-sync-external-store
            // These are tightly coupled dependencies that must load in correct order
            //
            // IMPORTANT: Use precise matching to avoid catching @radix-ui/react-* packages
            if ((id.includes('node_modules/react/') ||
                 id.includes('node_modules/react-dom/') ||
                 id.includes('node_modules/scheduler/') ||
                 id.includes('node_modules/react-is/') ||
                 id.includes('node_modules/use-sync-external-store/')) &&
                !id.includes('@radix-ui')) {
              return 'vendor-react-core';
            }

            // Radix Primitives - split into smaller chunks for progressive loading
            // CRITICAL: Dialog, Popover, Dropdown (used everywhere)
            if (id.includes('@radix-ui/react-dialog') ||
                id.includes('@radix-ui/react-popover') ||
                id.includes('@radix-ui/react-dropdown-menu') ||
                id.includes('@radix-ui/react-portal') ||
                id.includes('@radix-ui/react-dismissable-layer') ||
                id.includes('@radix-ui/react-focus-scope')) {
              return 'vendor-radix-critical';
            }

            // Radix Form Components (~60KB)
            // Semi-critical - used in most forms
            if (id.includes('@radix-ui/react-select') ||
                id.includes('@radix-ui/react-checkbox') ||
                id.includes('@radix-ui/react-radio-group') ||
                id.includes('@radix-ui/react-slider') ||
                id.includes('@radix-ui/react-switch') ||
                id.includes('@radix-ui/react-label')) {
              return 'vendor-radix-forms';
            }

            // Radix Layout Components (~40KB)
            // Low priority - lazy loaded
            if (id.includes('@radix-ui/react-accordion') ||
                id.includes('@radix-ui/react-tabs') ||
                id.includes('@radix-ui/react-collapsible') ||
                id.includes('@radix-ui/react-separator') ||
                id.includes('@radix-ui/react-scroll-area')) {
              return 'vendor-radix-layout';
            }

            // Radix Other Components (~30KB)
            // Lowest priority - load on-demand
            if (id.includes('@radix-ui')) {
              return 'vendor-radix-misc';
            }

            // Styling utilities - separate chunk (~15KB)
            // Update frequency: Very low (stable utility libraries)
            if (id.includes('class-variance-authority') ||
                id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-styling';
            }

            // Theme utilities - separate chunk (~10KB)
            // Semi-critical for avoiding FOUC
            if (id.includes('next-themes')) {
              return 'vendor-theme';
            }

            // UI components - separate chunk (~120KB)
            // Update frequency: Medium (toast/dialog libraries update occasionally)
            // CRITICAL: ALL React-dependent UI libraries MUST be bundled together
            // to ensure they load AFTER vendor-react-core (prevents "useLayoutEffect of undefined" errors)
            // This includes form libraries, date pickers, and accessibility utilities
            if (id.includes('sonner') ||
                id.includes('vaul') ||
                id.includes('react-resizable-panels') ||
                id.includes('react-hook-form') ||
                id.includes('input-otp') ||
                id.includes('react-day-picker') ||
                id.includes('react-aria') ||
                id.includes('react-stately')) {
              return 'vendor-ui-components';
            }

            // lucide-react: Bundle into dedicated vendor-icons chunk
            // Prevents 50+ tiny icon chunks (HTTP/2 overhead)
            // Icons barrel file already limits to ~113 icons = ~45 KB total
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            // Form libraries ecosystem (zod is React-independent)
            // React-dependent form libraries (react-hook-form, input-otp) are in vendor-ui-components
            if (id.includes('zod')) {
              return 'vendor-forms';
            }

            // Supabase - API client (React-independent)
            if (id.includes('@supabase/')) {
              return 'vendor-supabase';
            }

            // Date utilities (date-fns is React-independent)
            // React-dependent date picker (react-day-picker) is in vendor-ui-components
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }

            // React Aria/Stately now bundled in vendor-ui-components (moved to prevent loading errors)

            // Everything else - bundle into vendor-misc to avoid polluting react-core
            // Keep vendor-react-core as small as possible for fastest critical path
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
      'reactflow',        // Large - Only used in specific flowchart pages
      'recharts',         // 234 KB - Only used in dashboard/analytics charts
      '@stripe/stripe-js', // Lazy load payment processing
    ],
    // Optimize dependency discovery
    entries: [
      'src/main.tsx',
      'src/App.tsx',
    ],
  },
}));
