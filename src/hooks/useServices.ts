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
          consultants!inner (
            id,
            user_id,
            tier,
            calendar_link
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
        query = query.eq('consultants.tier', tierFilter as 'bronze' | 'silver' | 'gold' | 'platinum');
      }

      const { data: servicesData, error } = await query;

      if (error) throw error;

      // Now fetch profile data separately for each consultant
      const servicesWithProfiles = await Promise.all(
        (servicesData || []).map(async (service) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', service.consultants.user_id)
            .single();

          return {
            ...service,
            consultant: {
              ...service.consultants,
              profiles: profileData
            }
          };
        })
      );

      return servicesWithProfiles;
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