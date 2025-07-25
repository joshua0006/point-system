import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminService {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  consultant: {
    id: string;
    user_id: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    profile: {
      full_name: string | null;
      email: string;
    } | null;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
}

export const useAdminServices = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      console.log('Fetching all services for admin...');
      
      try {
        // Fetch all services (including inactive ones) with consultant and category data
        const { data: servicesData, error } = await supabase
          .from('services')
          .select(`
            id,
            title,
            description,
            price,
            duration_minutes,
            is_active,
            image_url,
            created_at,
            updated_at,
            consultant_id,
            category_id,
            consultants!inner (
              id,
              user_id,
              tier
            ),
            categories (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching services:', error);
          throw error;
        }

        console.log('Services data fetched:', servicesData);

        if (!servicesData || servicesData.length === 0) {
          console.log('No services found');
          return [];
        }

        // Fetch profile data for each consultant
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
                  profile: profileData || { full_name: null, email: 'Unknown' }
                },
                category: service.categories
              };
            } catch (err) {
              console.error('Error processing service:', service.id, err);
              return {
                ...service,
                consultant: {
                  ...service.consultants,
                  profile: { full_name: null, email: 'Unknown' }
                },
                category: service.categories
              };
            }
          })
        );

        console.log('Services with profiles:', servicesWithProfiles);
        return servicesWithProfiles as AdminService[];
      } catch (error) {
        console.error('Error in useAdminServices:', error);
        throw error;
      }
    },
    enabled: profile?.role === 'admin',
    retry: 3,
    retryDelay: 1000,
  });
};