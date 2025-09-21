import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { REALTIME_CHANNELS, REALTIME_TABLES } from "@/utils/admin/adminConstants";

interface UseAdminRealtimeProps {
  onDataChange?: () => void;
  enabled?: boolean;
}

export function useAdminRealtime({ onDataChange, enabled = true }: UseAdminRealtimeProps = {}) {
  const { user } = useAuth();
  const onDataChangeRef = useRef(onDataChange);
  
  // Keep the callback ref updated
  onDataChangeRef.current = onDataChange;
  
  // Stable callback that doesn't change between renders
  const stableOnDataChange = useCallback(() => {
    onDataChangeRef.current?.();
  }, []);

  useEffect(() => {
    if (!user || !enabled || !onDataChangeRef.current) return;

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
        stableOnDataChange();
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
        stableOnDataChange();
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
        stableOnDataChange();
      })
      .subscribe();

    // Cleanup function
    return () => {
      console.log('🔄 Cleaning up real-time admin listeners...');
      supabase.removeChannel(flexiCreditsChannel);
      supabase.removeChannel(bookingsChannel);  
      supabase.removeChannel(campaignsChannel);
    };
  }, [user, enabled, stableOnDataChange]);

  return {
    // This hook mainly manages subscriptions, no return values needed
    // Could add connection status tracking in the future if needed
    isConnected: !!user && enabled
  };
}