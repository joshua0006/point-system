import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, userEmail, isConsultant } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Update profile role if it's a consultant account
    if (isConsultant) {
      await supabaseClient
        .from('profiles')
        .update({ role: 'consultant' })
        .eq('user_id', userId)

      // Create consultant profile
      const { data: consultant, error: consultantError } = await supabaseClient
        .from('consultants')
        .insert({
          user_id: userId,
          bio: 'Experienced consultant providing expert advice and guidance',
          tier: 'gold',
          hourly_rate: 100,
          expertise_areas: ['Business Strategy', 'Marketing', 'Technology'],
          is_active: true
        })
        .select()
        .single()

      if (consultantError) {
        console.error('Error creating consultant:', consultantError)
        throw consultantError
      }

      // Create sample services for the consultant
      const sampleServices = [
        {
          consultant_id: consultant.id,
          title: '1-on-1 Business Strategy Session',
          description: 'Personalized consultation to help you develop and refine your business strategy',
          price: 150,
          duration_minutes: 60,
          category_id: '550e8400-e29b-41d4-a716-446655440000' // Business Strategy
        },
        {
          consultant_id: consultant.id,
          title: 'Marketing Plan Review',
          description: 'Comprehensive review of your marketing strategy with actionable recommendations',
          price: 100,
          duration_minutes: 45,
          category_id: '550e8400-e29b-41d4-a716-446655440001' // Marketing
        },
        {
          consultant_id: consultant.id,
          title: 'Tech Stack Consultation',
          description: 'Expert advice on technology choices and architecture decisions',
          price: 200,
          duration_minutes: 90,
          category_id: '550e8400-e29b-41d4-a716-446655440002' // Technology
        }
      ]

      const { error: servicesError } = await supabaseClient
        .from('services')
        .insert(sampleServices)

      if (servicesError) {
        console.error('Error creating services:', servicesError)
        throw servicesError
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Demo data setup complete' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error setting up demo data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})