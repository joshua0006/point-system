-- Create admin function to get user statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'master_admin'::text])) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Get stats
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_consultants', (SELECT COUNT(*) FROM consultants WHERE is_active = true),
    'active_services', (SELECT COUNT(*) FROM services WHERE is_active = true),
    'active_bookings', (SELECT COUNT(*) FROM bookings WHERE status IN ('pending', 'confirmed'))
  ) INTO result;

  RETURN result;
END;
$$;