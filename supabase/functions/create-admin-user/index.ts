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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Verify requester is master admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'master_admin') {
      return new Response(
        JSON.stringify({ error: "Forbidden: Master admin access required" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, role, fullName } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (!role || !['admin', 'master_admin'].includes(role)) {
      throw new Error("Role must be 'admin' or 'master_admin'");
    }

    // Create the user
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split('@')[0]
      }
    });

    if (createError) throw new Error(`Error creating user: ${createError.message}`);

    // Create profile with admin role
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        user_id: newUser.user.id,
        email: email,
        full_name: fullName || email.split('@')[0],
        role: role,
        approval_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      });

    if (profileError) throw new Error(`Error creating profile: ${profileError.message}`);

    console.log(`[CREATE-ADMIN] New ${role} created: ${email} by ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${role} account created successfully`,
        email,
        userId: newUser.user.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CREATE-ADMIN] ERROR:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
