import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { REALTIME_CHANNELS, REALTIME_TABLES } from "@/utils/admin/adminConstants";

interface UseAdminRealtimeProps {
  onDataChange?: () => void;
  enabled?: boolean;
}

export function useAdminRealtime({ onDataChange, enabled = true }: UseAdminRealtimeProps = {}) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !enabled || !onDataChange) return;

    console.log('🔄 Setting up real-time admin listeners...');

    // Set up real-time listeners for activity updates
    const flexiCreditsChannel = supabase
      .channel(REALTIME_CHANNELS.ADMIN_FLEXI_CREDITS)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: REALTIME_TABLES.FLEXI_CREDITS_TRANSACTIONS
      }, (payload) => {
        console.log('💳 Flexi credits transaction change:', payload);
        onDataChange();
      })
      .subscribe();

    const bookingsChannel = supabase
      .channel(REALTIME_CHANNELS.ADMIN_BOOKINGS)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: REALTIME_TABLES.BOOKINGS
      }, (payload) => {
        console.log('📅 Booking change:', payload);
        onDataChange();
      })
      .subscribe();

    const campaignsChannel = supabase
      .channel(REALTIME_CHANNELS.ADMIN_CAMPAIGNS)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: REALTIME_TABLES.LEAD_GEN_CAMPAIGNS
      }, (payload) => {
        console.log('🎯 Campaign change:', payload);
        onDataChange();
      })
      .subscribe();

    // Cleanup function
    return () => {
      console.log('🔄 Cleaning up real-time admin listeners...');
      supabase.removeChannel(flexiCreditsChannel);
      supabase.removeChannel(bookingsChannel);  
      supabase.removeChannel(campaignsChannel);
    };
  }, [user, enabled, onDataChange]);

  return {
    // This hook mainly manages subscriptions, no return values needed
    // Could add connection status tracking in the future if needed
    isConnected: !!user && enabled
  };
}