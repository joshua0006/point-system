import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { points } = await req.json();
    
    console.log(`Adding ${points} points to user ${user.id}`);

    // Add points to user's balance
    const { error: pointsError } = await supabaseClient.rpc('increment_points_balance', {
      user_id: user.id,
      points_to_add: points
    });

    if (pointsError) {
      throw pointsError;
    }

    // Create a transaction record
    const { error: transactionError } = await supabaseClient
      .from('points_transactions')
      .insert({
        user_id: user.id,
        type: 'purchase',
        amount: points,
        description: `Manual points addition - ${points} points`
      });

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError);
    }

    console.log(`Successfully added ${points} points to user ${user.id}`);

    return new Response(JSON.stringify({ success: true, points_added: points }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});