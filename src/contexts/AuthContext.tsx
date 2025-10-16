
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'consultant' | 'admin' | 'sales' | 'master_admin';
  flexi_credits_balance: number;
  created_at: string;
  updated_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  plan_name: string | null;
  credits_per_month: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: SubscriptionStatus | null;
  loading: boolean;
  isRefetching: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

// Create context first
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export AuthContext for defensive usage in hooks  
export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  // Debounce protection: prevent rapid successive auth checks (e.g., from tab switching)
  const lastAuthCheckTime = useRef(0);
  const MIN_AUTH_CHECK_INTERVAL = 5000; // 5 seconds

  // Visibility tracking: prevent auth refetches triggered by tab visibility changes
  const lastVisibilityChange = useRef(0);
  const VISIBILITY_DEBOUNCE = 3000; // 3 seconds after tab becomes visible

  // Store current profile/subscription in refs to avoid stale closures
  const profileRef = useRef(profile);
  const subscriptionRef = useRef(subscription);

  useEffect(() => {
    profileRef.current = profile;
    subscriptionRef.current = subscription;
  }, [profile, subscription]);

  useEffect(() => {
    let mounted = true;
    let realtimeChannel: any = null;

    // Track tab visibility changes to prevent unnecessary auth refetches
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastVisibilityChange.current = Date.now();
        logger.log('[AUTH] Tab became visible - suppressing auth checks for', VISIBILITY_DEBOUNCE, 'ms');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Ignore auth events when tab is hidden to prevent tab-switch reloads
        if (typeof document !== 'undefined' && document.hidden) {
          logger.log('[AUTH] Ignoring auth event - tab hidden');
          return;
        }

        // Ignore auth events shortly after tab becomes visible (prevents tab-switch rerenders)
        const timeSinceVisible = Date.now() - lastVisibilityChange.current;
        if (timeSinceVisible < VISIBILITY_DEBOUNCE && timeSinceVisible > 0) {
          logger.log('[AUTH] Ignoring auth event - recent tab switch (', timeSinceVisible, 'ms since visible)');
          return;
        }

        logger.log('[AUTH] Auth state changed:', event, session?.user?.email);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use refs to get current values (avoid stale closures)
          const currentProfile = profileRef.current;
          const currentSubscription = subscriptionRef.current;

          // Skip refetch if data already loaded for this user
          if (currentProfile?.user_id === session.user.id && currentSubscription) {
            logger.log('[AUTH] Data already loaded, skipping fetch');
            return;
          }

          // Debounce: Skip if checked too recently (prevents rapid refetches)
          const now = Date.now();
          if (now - lastAuthCheckTime.current < MIN_AUTH_CHECK_INTERVAL) {
            logger.log('[AUTH] Skipping refetch - too soon since last check (',
              now - lastAuthCheckTime.current, 'ms)');
            return;
          }

          // Determine if this is initial load or background refetch
          const isInitialLoad = !currentProfile || !currentSubscription;

          if (isInitialLoad) {
            logger.log('[AUTH] Initial load - setting loading state');
            setLoading(true);
          } else {
            logger.log('[AUTH] Background refetch - using refetch state');
            setIsRefetching(true);
          }

          // Defer profile and subscription fetch to avoid blocking auth state updates
          requestIdleCallback(async () => {
            if (!mounted) return;

            lastAuthCheckTime.current = now;

            try {
              // Parallel fetch for better performance
              const [profileResult, subscriptionResult] = await Promise.allSettled([
                supabase.from('profiles').select('*').eq('user_id', session.user.id.toString()).single(),
                supabase.functions.invoke('check-subscription')
              ]);
              
              if (!mounted) return;
              
              // Handle profile result
              if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
                setProfile(profileResult.value.data);
                logger.log('Profile loaded successfully:', profileResult.value.data);
              } else {
                console.error('Error fetching profile:', profileResult.status === 'fulfilled' ? profileResult.value.error : profileResult.reason);
                setProfile(null);
              }

              // Handle subscription result  
              if (subscriptionResult.status === 'fulfilled' && !subscriptionResult.value.error) {
                logger.log('✅ Subscription loaded successfully:', subscriptionResult.value.data);
                setSubscription(subscriptionResult.value.data);
              } else {
                console.error('❌ Error fetching subscription:', subscriptionResult.status === 'fulfilled' ? subscriptionResult.value.error : subscriptionResult.reason);
                setSubscription(null);
              }

              // Set up real-time subscription for profile updates
              if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
              }
              
              realtimeChannel = supabase
                .channel('profile-changes')
                .on(
                  'postgres_changes',
                  {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                     filter: `user_id=eq.${session.user.id.toString()}`
                  },
                  (payload) => {
                    if (mounted) {
                      logger.log('Profile updated via realtime:', payload.new);
                      setProfile(payload.new as Profile);
                    }
                  }
                )
                .subscribe();
            } catch (err) {
              console.error('Profile/subscription fetch error:', err);
            } finally {
              if (mounted) {
                // Clear the appropriate loading state
                if (isInitialLoad) {
                  setLoading(false);
                  logger.log('[AUTH] Initial load complete');
                } else {
                  setIsRefetching(false);
                  logger.log('[AUTH] Background refetch complete');
                }
              }
            }
          });
        } else {
          setProfile(null);
          setSubscription(null);
          // Clean up realtime subscription
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
        }

        if (!session?.user) {
          setLoading(false);
        }
      }
    );

    // Check for existing session on component mount
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        logger.log('Initial session check:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            // Fetch profile
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id.toString())
              .single();
            
            if (mounted) {
              if (error) {
                console.error('Profile fetch error during init:', error);
                setProfile(null);
              } else {
                setProfile(profileData);
                logger.log('Profile loaded during init:', profileData);
              }
            }

            // Set up real-time subscription for profile updates
            if (realtimeChannel) {
              supabase.removeChannel(realtimeChannel);
            }
            
            realtimeChannel = supabase
              .channel('profile-changes')
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'profiles',
                  filter: `user_id=eq.${session.user.id.toString()}`
                },
                (payload) => {
                  if (mounted) {
                    logger.log('Profile updated via realtime:', payload.new);
                    setProfile(payload.new as Profile);
                  }
                }
              )
              .subscribe();

            // Fetch subscription status
            try {
              const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription');
              
              if (mounted) {
                if (subscriptionError) {
                  console.error('Subscription fetch error during init:', subscriptionError);
                  setSubscription(null);
                } else {
                  setSubscription(subscriptionData);
                  logger.log('Subscription loaded during init:', subscriptionData);
                }
              }
            } catch (err) {
              console.error('Subscription fetch error during init:', err);
            }
          } catch (err) {
            console.error('Profile fetch error during init:', err);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      // Clean up visibility change listener
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  const cleanupAuthState = () => {
    // Clear all auth-related keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage as well
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Clear component state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Attempt global sign out (fallback if it fails)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Global signout failed, continuing with local cleanup:', err);
      }
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clean up and redirect
      cleanupAuthState();
      window.location.href = '/';
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id.toString())
        .single();

      if (error) {
        console.error('Error refreshing profile:', error);
        setProfile(null);
      } else {
        setProfile(profileData);
        logger.log('Profile refreshed:', profileData);
      }
    } catch (err) {
      console.error('Profile refresh error:', err);
    }
  }, [user]);

  const refreshSubscription = useCallback(async () => {
    if (!user) return;

    try {
      logger.log('🔄 Refreshing subscription status for user:', user.email);
      const { data: subscriptionData, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('❌ Error refreshing subscription:', error);
        setSubscription(null);
      } else {
        logger.log('✅ Subscription refreshed successfully:', subscriptionData);
        setSubscription(subscriptionData);
      }
    } catch (err) {
      console.error('Subscription refresh error:', err);
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    subscription,
    loading,
    isRefetching,
    signOut,
    refreshProfile,
    refreshSubscription,
  }), [user, session, profile, subscription, loading, isRefetching, refreshProfile, refreshSubscription]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
