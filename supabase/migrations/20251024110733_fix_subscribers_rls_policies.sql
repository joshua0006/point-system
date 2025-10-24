-- Fix Critical RLS Security Vulnerability in Subscribers Table
-- Issue: update_own_subscription policy has USING (true) allowing anyone to modify any subscription
-- Impact: Prevents unauthorized subscription tier changes, credit manipulation, and billing fraud

-- Drop insecure policies
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create secure UPDATE policy: Users can only update their own subscription, admins can update all
CREATE POLICY "Users can update own subscription, admins can update all"
ON "public"."subscribers"
FOR UPDATE
USING (
  ("user_id" = "auth"."uid"())
  OR ("public"."get_user_role"("auth"."uid"()) = ANY(ARRAY['admin'::"text", 'master_admin'::"text"]))
);

-- Create secure INSERT policy: Authenticated users can create their own subscription
CREATE POLICY "Authenticated users can create own subscription"
ON "public"."subscribers"
FOR INSERT
WITH CHECK (
  ("user_id" = "auth"."uid"())
  OR ("public"."get_user_role"("auth"."uid"()) = ANY(ARRAY['admin'::"text", 'master_admin'::"text"]))
);

-- Add admin SELECT policy for comprehensive subscription management
-- Note: This complements the existing "select_own_subscription" policy
CREATE POLICY "Admins can view all subscriptions"
ON "public"."subscribers"
FOR SELECT
USING (
  ("public"."get_user_role"("auth"."uid"()) = ANY(ARRAY['admin'::"text", 'master_admin'::"text"]))
);

-- Security Verification Queries (for testing):
-- 1. Test non-admin user can only see/update their own subscription:
--    SELECT * FROM subscribers WHERE user_id != auth.uid(); -- Should return 0 rows for non-admin
--    UPDATE subscribers SET credits_per_month = 999 WHERE user_id != auth.uid(); -- Should fail for non-admin
--
-- 2. Test admin can see/update all subscriptions:
--    SELECT * FROM subscribers; -- Should return all rows for admin
--    UPDATE subscribers SET credits_per_month = X WHERE id = Y; -- Should succeed for admin
--
-- 3. Test authenticated user can only insert their own subscription:
--    INSERT INTO subscribers (user_id, email) VALUES (auth.uid(), auth.email()); -- Should succeed
--    INSERT INTO subscribers (user_id, email) VALUES ('other-user-id', 'other@email.com'); -- Should fail
