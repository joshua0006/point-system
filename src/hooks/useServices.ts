
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
    user_id: string;
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
      console.log('Fetching services...');
      
      try {
        // First, get services with basic consultant and category data
        let query = supabase
          .from('services')
          .select(`
            id,
            title,
            description,
            price,
            duration_minutes,
            is_active,
            consultant_id,
            category_id,
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

        const { data: servicesData, error } = await query;

        if (error) {
          console.error('Error fetching services:', error);
          throw error;
        }

        console.log('Services data fetched:', servicesData);

        if (!servicesData || servicesData.length === 0) {
          console.log('No services found');
          return [];
        }

        // Now fetch profile data for each consultant
        const servicesWithProfiles = await Promise.all(
          servicesData.map(async (service) => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('user_id', service.consultants.user_id)
                .maybeSingle();

              if (profileError) {
                console.error('Error fetching profile for consultant:', service.consultants.user_id, profileError);
              }

              return {
                ...service,
                consultant: {
                  ...service.consultants,
                  profiles: profileData || { full_name: null, email: 'Unknown' }
                }
              };
            } catch (err) {
              console.error('Error processing service:', service.id, err);
              return {
                ...service,
                consultant: {
                  ...service.consultants,
                  profiles: { full_name: null, email: 'Unknown' }
                }
              };
            }
          })
        );

        console.log('Services with profiles:', servicesWithProfiles);
        return servicesWithProfiles;
      } catch (error) {
        console.error('Error in useServices:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          throw error;
        }

        console.log('Categories fetched:', data);
        return data || [];
      } catch (error) {
        console.error('Error in useCategories:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });
};
