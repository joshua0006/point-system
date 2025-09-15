import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
          setData(cached.data);
          setLoading(false);
          return;
        }
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
      
      // Retry logic
      if (retryCount < retry) {
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