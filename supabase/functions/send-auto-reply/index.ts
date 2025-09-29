import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { conversationId, sellerId } = await req.json()

    if (!conversationId || !sellerId) {
      throw new Error('Missing required parameters: conversationId and sellerId')
    }

    // Create Supabase client with service role key for elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Checking auto-reply for seller:', sellerId)

    // Check if the consultant has auto-reply enabled
    const { data: consultant, error: consultantError } = await supabaseAdmin
      .from('consultants')
      .select('auto_reply_enabled, auto_reply_message, user_id')
      .eq('user_id', sellerId)
      .maybeSingle()

    if (consultantError) {
      console.error('Error fetching consultant auto-reply settings:', consultantError)
      throw consultantError
    }

    if (!consultant) {
      console.log('No consultant found for user:', sellerId)
      return new Response(
        JSON.stringify({ success: false, message: 'Consultant not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Consultant auto-reply settings:', consultant)

    // If auto-reply is not enabled or no message is set, don't send anything
    if (!consultant.auto_reply_enabled || !consultant.auto_reply_message) {
      console.log('Auto-reply not enabled or no message set')
      return new Response(
        JSON.stringify({ success: true, message: 'Auto-reply not enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if there are already messages in this conversation
    // We only want to send auto-reply for the very first message
    const { data: existingMessages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .limit(1)

    if (messagesError) {
      console.error('Error checking existing messages:', messagesError)
      throw messagesError
    }

    // If there are already messages, don't send auto-reply
    if (existingMessages && existingMessages.length > 0) {
      console.log('Messages already exist in conversation, skipping auto-reply')
      return new Response(
        JSON.stringify({ success: true, message: 'Auto-reply skipped - messages exist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending auto-reply message:', consultant.auto_reply_message)

    // Send the auto-reply message using service role permissions
    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sellerId,
        message_text: consultant.auto_reply_message,
        message_type: 'text',
      })

    if (messageError) {
      console.error('Error sending auto-reply:', messageError)
      throw messageError
    }

    console.log('Auto-reply sent successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Auto-reply sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Auto-reply function error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})