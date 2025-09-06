import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-BILLING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting billing system validation");

    // Validate environment variables
    const requiredEnvVars = [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET", 
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY"
    ];

    const missingVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    logStep("Environment variables validated", { count: requiredEnvVars.length });

    // Test Stripe connection
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const products = await stripe.products.list({ limit: 1 });
    logStep("Stripe connection validated", { productCount: products.data.length });

    // Test Supabase connection
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Test database access
    const { data: profilesTest, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (profilesError) {
      throw new Error(`Database connection failed: ${profilesError.message}`);
    }
    logStep("Database connection validated", { profileCount: profilesTest?.length || 0 });

    // Test RPC function
    const testUserId = "00000000-0000-0000-0000-000000000000"; // Invalid UUID for testing
    const { error: rpcError } = await supabaseClient.rpc('increment_flexi_credits_balance', {
      user_id: testUserId,
      credits_to_add: 0
    });
    
    // We expect this to fail with "User profile not found" - this confirms the function exists
    const rpcWorking = rpcError?.message?.includes("User profile not found");
    if (!rpcWorking) {
      logStep("Warning: RPC function may not be working properly", { error: rpcError?.message });
    } else {
      logStep("RPC function validated");
    }

    // Check transaction table structure
    const { data: transactionStructure, error: structureError } = await supabaseClient
      .from('flexi_credits_transactions')
      .select('user_id, type, amount, description, created_at')
      .limit(1);

    if (structureError) {
      throw new Error(`Transaction table structure error: ${structureError.message}`);
    }
    logStep("Transaction table structure validated");

    // Test summary
    const validationResults = {
      environment_variables: "✓ All required variables present",
      stripe_connection: "✓ Successfully connected to Stripe",
      database_connection: "✓ Successfully connected to Supabase",
      rpc_function: rpcWorking ? "✓ RPC function working" : "⚠ RPC function may have issues", 
      transaction_table: "✓ Transaction table structure valid",
      status: "healthy"
    };

    logStep("Billing system validation completed successfully");

    return new Response(JSON.stringify({
      success: true,
      validation_results: validationResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Billing system validation failed", { error: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      status: "unhealthy",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});