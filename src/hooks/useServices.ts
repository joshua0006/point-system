import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  is_active: boolean;
  consultant: {
    id: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    calendar_link: string | null;
    profiles: {
      full_name: string | null;
      email: string;
    } | null;
  } | null;
  categories: {
    id: string;
    name: string;
  } | null;
}

export const useServices = (categoryFilter?: string, tierFilter?: string) => {
  return useQuery({
    queryKey: ['services', categoryFilter, tierFilter],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          consultant:consultants!inner (
            id,
            tier,
            calendar_link,
            profiles!inner (
              full_name,
              email
            )
          ),
          categories (
            id,
            name
          )
        `)
        .eq('is_active', true);

      if (categoryFilter) {
        query = query.eq('categories.name', categoryFilter);
      }

      if (tierFilter) {
        query = query.eq('consultant.tier', tierFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};