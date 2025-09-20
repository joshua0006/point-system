import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface QueryOptions {
  cacheKey?: string;
  cacheTime?: number; // in ms
  retry?: number;
  retryDelay?: number;
}

const queryCache = new Map<string, { data: any; timestamp: number; expiry: number }>();

export const useOptimizedQuery = <T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: QueryOptions = {}
) => {
  const {
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    retry = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      // Check cache first if cacheKey provided
      if (cacheKey) {
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
          logger.debug('Cache hit for query:', cacheKey);
          setData(cached.data);
          setLoading(false);
          return;
        }
        logger.debug('Cache miss for query:', cacheKey);
      }

      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      // Cache the result
      if (cacheKey) {
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          expiry: Date.now() + cacheTime
        });
      }
      
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      logger.error('Query failed:', error, 'Retry count:', retryCount);
      
      // Retry logic
      if (retryCount < retry) {
        logger.debug(`Retrying query (${retryCount + 1}/${retry}) after ${retryDelay * (retryCount + 1)}ms`);
        setTimeout(() => fetchData(retryCount + 1), retryDelay * (retryCount + 1));
        return;
      }
      
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, cacheKey, cacheTime, retry, retryDelay, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    if (cacheKey) {
      logger.debug('Clearing cache for refetch:', cacheKey);
      queryCache.delete(cacheKey);
    }
    return fetchData();
  }, [fetchData, cacheKey]);

  return { data, loading, error, refetch };
};

// Utility to clear all cache
export const clearQueryCache = () => {
  queryCache.clear();
};

// Utility to clear specific cache entry
export const clearCacheEntry = (key: string) => {
  queryCache.delete(key);
};