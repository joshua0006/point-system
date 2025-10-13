/**
 * Icon Size Constants
 * Standardized icon sizing for consistent UI across the application
 */
export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-12 w-12',
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/**
 * Get icon size class names
 * @param size - Size key from ICON_SIZES
 * @returns Tailwind classes for icon sizing
 */
export const getIconSize = (size: IconSize = 'md'): string => {
  return ICON_SIZES[size];
};

/**
 * Icon accessibility helpers
 */
export const iconA11y = {
  /**
   * For decorative icons (icons paired with text labels)
   * These should be hidden from screen readers
   */
  decorative: { 'aria-hidden': true } as const,

  /**
   * For semantic icons (icons conveying meaning without text)
   * @param label - Accessible label for screen readers
   */
  semantic: (label: string) => ({
    'aria-label': label,
    role: 'img',
  } as const),
} as const;
