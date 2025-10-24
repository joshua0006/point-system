export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Optimize CSS in production
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          minifyFontValues: { removeQuotes: false },
          // Preserve calc() for dynamic values
          calc: false,
        }],
      },
    } : {}),
  },
}
