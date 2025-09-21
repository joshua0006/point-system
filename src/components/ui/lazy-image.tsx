import { useState, ImgHTMLAttributes } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  placeholder?: string;
  blurPlaceholder?: boolean;
  rootMargin?: string;
}

export function LazyImage({
  src,
  alt = '',
  placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  blurPlaceholder = true,
  rootMargin = '50px',
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver({
    rootMargin,
    freezeOnceVisible: true,
  });

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div ref={elementRef as any} className={cn('relative overflow-hidden', className)}>
      <img
        {...props}
        src={isVisible ? src : placeholder}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          blurPlaceholder && !isLoaded && 'blur-sm',
          className
        )}
        loading="lazy"
        decoding="async"
      />
      
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Failed to load</span>
        </div>
      )}
    </div>
  );
}