import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export const VirtualList = memo(function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = '',
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(height / itemHeight) + overscan,
    items.length
  );
  const actualStart = Math.max(0, visibleStart - overscan);

  const visibleItems = useMemo(() => {
    return items.slice(actualStart, visibleEnd).map((item, index) => ({
      item,
      index: actualStart + index
    }));
  }, [items, actualStart, visibleEnd]);

  const totalHeight = items.length * itemHeight;
  const offsetY = actualStart * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`} 
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default VirtualList;