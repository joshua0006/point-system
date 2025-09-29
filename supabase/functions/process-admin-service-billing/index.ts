import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAssignment {
  id: string;
  user_id: string;
  service_type: string;
  service_level: string;
  monthly_cost: number;
  next_billing_date: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ADMIN-SERVICE-BILLING] Processing admin service billing...');

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get service assignments that are due for billing
    const { data: assignments, error: assignmentsError } = await supabase
      .from('admin_service_assignments')
      .select('*')
      .eq('status', 'active')
      .lte('next_billing_date', currentDate);

    if (assignmentsError) {
      console.error('[ADMIN-SERVICE-BILLING] Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    if (!assignments || assignments.length === 0) {
      console.log('[ADMIN-SERVICE-BILLING] No assignments due for billing');
      return new Response(
        JSON.stringify({ message: 'No assignments due for billing', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN-SERVICE-BILLING] Found ${assignments.length} assignments to process`);

    let processedCount = 0;
    let errors: any[] = [];

    for (const assignment of assignments as ServiceAssignment[]) {
      try {
        console.log(`[ADMIN-SERVICE-BILLING] Processing assignment ${assignment.id} for user ${assignment.user_id}`);

        // Get user's current balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('flexi_credits_balance, full_name, email')
          .eq('user_id', assignment.user_id)
          .single();

        if (profileError) {
          console.error(`[ADMIN-SERVICE-BILLING] Error fetching profile for user ${assignment.user_id}:`, profileError);
          errors.push({ assignment_id: assignment.id, error: profileError.message });
          continue;
        }

        const currentBalance = profile.flexi_credits_balance || 0;

        // Check if user has sufficient balance
        if (currentBalance < assignment.monthly_cost) {
          console.log(`[ADMIN-SERVICE-BILLING] Insufficient balance for user ${assignment.user_id}. Balance: ${currentBalance}, Required: ${assignment.monthly_cost}`);
          
          // Log the failed billing attempt but don't stop the service
          await supabase
            .from('admin_service_billing_transactions')
            .insert({
              assignment_id: assignment.id,
              user_id: assignment.user_id,
              service_type: assignment.service_type,
              service_level: assignment.service_level,
              amount: assignment.monthly_cost,
              billing_date: currentDate,
              status: 'failed',
              notes: `Insufficient balance. Required: ${assignment.monthly_cost}, Available: ${currentBalance}`
            });

          continue;
        }

        // Deduct credits from user's balance
        const newBalance = currentBalance - assignment.monthly_cost;
        
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ 
            flexi_credits_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', assignment.user_id);

        if (balanceError) {
          console.error(`[ADMIN-SERVICE-BILLING] Error updating balance for user ${assignment.user_id}:`, balanceError);
          errors.push({ assignment_id: assignment.id, error: balanceError.message });
          continue;
        }

        // Record the transaction
        const { error: transactionError } = await supabase
          .from('flexi_credits_transactions')
          .insert({
            user_id: assignment.user_id,
            type: 'service',
            amount: -assignment.monthly_cost,
            description: `Monthly ${assignment.service_type === 'va_support' ? 'VA Support' : 'Cold Calling'} service billing - ${assignment.service_level}`
          });

        if (transactionError) {
          console.error(`[ADMIN-SERVICE-BILLING] Error creating transaction for user ${assignment.user_id}:`, transactionError);
          // Don't rollback, just log the error
        }

        // Record billing transaction
        const { error: billingError } = await supabase
          .from('admin_service_billing_transactions')
          .insert({
            assignment_id: assignment.id,
            user_id: assignment.user_id,
            service_type: assignment.service_type,
            service_level: assignment.service_level,
            amount: assignment.monthly_cost,
            billing_date: currentDate,
            status: 'completed'
          });

        if (billingError) {
          console.error(`[ADMIN-SERVICE-BILLING] Error creating billing transaction:`, billingError);
          // Don't rollback, just log the error
        }

        // Update next billing date (add 1 month)
        const nextBillingDate = new Date(assignment.next_billing_date);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        
        const { error: updateError } = await supabase
          .from('admin_service_assignments')
          .update({ 
            next_billing_date: nextBillingDate.toISOString().split('T')[0] 
          })
          .eq('id', assignment.id);

        if (updateError) {
          console.error(`[ADMIN-SERVICE-BILLING] Error updating next billing date:`, updateError);
          errors.push({ assignment_id: assignment.id, error: updateError.message });
        } else {
          processedCount++;
          console.log(`[ADMIN-SERVICE-BILLING] Successfully processed assignment ${assignment.id}`);
        }

      } catch (error: any) {
        console.error(`[ADMIN-SERVICE-BILLING] Error processing assignment ${assignment.id}:`, error);
        errors.push({ assignment_id: assignment.id, error: error?.message || 'Unknown error' });
      }
    }

    console.log(`[ADMIN-SERVICE-BILLING] Completed processing. Successful: ${processedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        message: 'Admin service billing completed',
        processed: processedCount,
        errors: errors.length,
        errorDetails: errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[ADMIN-SERVICE-BILLING] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});