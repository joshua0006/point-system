-- Create a view for upcoming flexi credit charges
CREATE VIEW upcoming_flexi_charges AS
SELECT 
  cp.user_id,
  cp.consultant_name,
  cp.monthly_budget as amount,
  cp.next_billing_date as due_date,
  cp.billing_status,
  lgc.name as campaign_name,
  cp.campaign_id,
  cp.id as participant_id,
  -- Calculate days until charge
  CASE 
    WHEN cp.next_billing_date IS NULL THEN NULL
    WHEN cp.next_billing_date <= CURRENT_DATE THEN 0
    ELSE cp.next_billing_date - CURRENT_DATE
  END as days_until_charge,
  -- Determine if this is overdue
  CASE 
    WHEN cp.next_billing_date IS NULL THEN false
    ELSE cp.next_billing_date <= CURRENT_DATE
  END as is_overdue
FROM campaign_participants cp
LEFT JOIN lead_gen_campaigns lgc ON cp.campaign_id = lgc.id
WHERE cp.billing_status = 'active' 
  AND cp.monthly_budget IS NOT NULL 
  AND cp.monthly_budget > 0
  AND cp.next_billing_date IS NOT NULL;

-- Create RPC function for users to get their upcoming charges
CREATE OR REPLACE FUNCTION my_upcoming_flexi_charges()
RETURNS TABLE (
  consultant_name text,
  amount integer,
  due_date date,
  billing_status text,
  campaign_name text,
  campaign_id uuid,
  participant_id uuid,
  days_until_charge integer,
  is_overdue boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ufc.consultant_name,
    ufc.amount,
    ufc.due_date,
    ufc.billing_status,
    ufc.campaign_name,
    ufc.campaign_id,
    ufc.participant_id,
    ufc.days_until_charge,
    ufc.is_overdue
  FROM upcoming_flexi_charges ufc
  WHERE ufc.user_id = auth.uid()
  ORDER BY ufc.due_date ASC NULLS LAST, ufc.amount DESC;
$$;