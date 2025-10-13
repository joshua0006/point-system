import { ReactNode } from 'react';
import { useFocusRing } from 'react-aria';
import { cn } from '@/lib/utils';

interface FocusIndicatorProps {
  children: ReactNode;
  className?: string;
  focusRingClass?: string;
}

/**
 * FocusIndicator Component
 *
 * Wraps interactive elements to provide visible focus indicators that meet
 * WCAG 2.1 Level AA requirements. Uses react-aria's useFocusRing to show
 * focus only during keyboard navigation, not mouse/touch interactions.
 *
 * @example
 * <FocusIndicator>
 *   <button>Click me</button>
 * </FocusIndicator>
 */
export function FocusIndicator({
  children,
  className,
  focusRingClass = 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none'
}: FocusIndicatorProps) {
  const { isFocusVisible, focusProps } = useFocusRing();

  return (
    <div
      {...focusProps}
      className={cn(
        'rounded-lg transition-all duration-200',
        isFocusVisible && focusRingClass,
        className
      )}
      data-focus-visible={isFocusVisible}
    >
      {children}
    </div>
  );
}

/**
 * Hook for applying focus ring styles to any element
 *
 * @example
 * function MyButton() {
 *   const { isFocusVisible, focusProps } = useFocusRingProps();
 *   return <button {...focusProps} className={isFocusVisible ? 'ring-2' : ''}>Click</button>
 * }
 */
export function useFocusRingProps() {
  return useFocusRing();
}
