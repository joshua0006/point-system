import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AuthContext } from '@/contexts/AuthContext';
import { useContext } from 'react';

export interface UpcomingCharge {
  consultant_name: string;
  amount: number;
  due_date: string;
  billing_status: string;
  campaign_name: string;
  campaign_id: string;
  participant_id: string;
  days_until_charge: number;
  is_overdue: boolean;
}

export function useUpcomingCharges() {
  const authContext = useContext(AuthContext);
  
  // If auth context is not available, return disabled query
  if (!authContext) {
    return useQuery({
      queryKey: ['upcoming-charges', null],
      queryFn: () => Promise.resolve([]),
      enabled: false,
    });
  }
  
  const { user } = authContext;

  return useQuery({
    queryKey: ['upcoming-charges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: charges, error } = await supabase.rpc('my_upcoming_flexi_charges');

      if (error) {
        console.error('Error fetching upcoming charges:', error);
        throw error;
      }

      return (charges || []).map(charge => ({
        ...charge,
        due_date: new Date(charge.due_date).toLocaleDateString(),
      })) as UpcomingCharge[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on tab switch
    refetchOnMount: false, // Prevent refetch on component remount
  });
}