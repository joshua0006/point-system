import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting recurring deductions processing...');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Processing deductions for date: ${today}`);

    // Get all active recurring deductions due today
    const { data: deductions, error: fetchError } = await supabaseClient
      .from('admin_recurring_deductions')
      .select('*')
      .eq('status', 'active')
      .eq('next_billing_date', today);

    if (fetchError) {
      console.error('❌ Error fetching deductions:', fetchError);
      throw fetchError;
    }

    if (!deductions || deductions.length === 0) {
      console.log('✅ No deductions due today');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No deductions due today',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${deductions.length} deduction(s) to process`);

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Process each deduction
    for (const deduction of deductions) {
      try {
        console.log(`💰 Processing deduction for user ${deduction.user_id}, amount: ${deduction.amount}`);

        // Call the deduct_points function
        const { data: deductData, error: deductError } = await supabaseClient.rpc(
          'deduct_points',
          {
            p_user_id: deduction.user_id,
            p_amount: parseFloat(deduction.amount),
            p_description: `Recurring deduction: ${deduction.reason}`
          }
        );

        if (deductError) {
          console.error(`❌ Failed to deduct for user ${deduction.user_id}:`, deductError);
          results.failed++;
          results.errors.push({
            userId: deduction.user_id,
            error: deductError.message
          });
          continue;
        }

        // Calculate next billing date
        const currentDate = new Date(deduction.next_billing_date);
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        // Handle day of month edge cases (e.g., if day is 31 but next month has 30 days)
        const nextDay = Math.min(deduction.day_of_month, new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ).getDate());
        
        currentDate.setDate(nextDay);
        const nextBillingDate = currentDate.toISOString().split('T')[0];

        console.log(`📅 Next billing date for user ${deduction.user_id}: ${nextBillingDate}`);

        // Update the recurring deduction record
        const { error: updateError } = await supabaseClient
          .from('admin_recurring_deductions')
          .update({
            next_billing_date: nextBillingDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', deduction.id);

        if (updateError) {
          console.error(`⚠️ Warning: Failed to update next billing date for ${deduction.user_id}:`, updateError);
          results.errors.push({
            userId: deduction.user_id,
            warning: 'Deduction successful but failed to update next billing date',
            error: updateError.message
          });
        }

        results.processed++;
        console.log(`✅ Successfully processed deduction for user ${deduction.user_id}`);

      } catch (error) {
        console.error(`❌ Unexpected error processing deduction for user ${deduction.user_id}:`, error);
        results.failed++;
        results.errors.push({
          userId: deduction.user_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('🏁 Processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} deductions, ${results.failed} failed`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error in recurring deductions processor:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
