
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

    const { userId, userEmail, isConsultant, email, password, fullName, autoConfirm } = await req.json()

    // Handle creating new demo accounts with auto-confirmation
    if (email && password && autoConfirm) {
      console.log('Creating new demo account:', email)
      
      // Create the user with admin privileges (bypasses email confirmation)
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // This automatically confirms the email
        user_metadata: {
          full_name: fullName
        }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        throw createError
      }

      console.log('User created successfully:', newUser.user?.id)

      // Set up the user's profile and consultant data
      if (newUser.user) {
        // Update profile role if it's a consultant account
        if (isConsultant) {
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ role: 'consultant' })
            .eq('user_id', newUser.user.id)

          if (profileError) {
            console.error('Error updating profile:', profileError)
          }

          // Create consultant profile
          const { data: consultant, error: consultantError } = await supabaseClient
            .from('consultants')
            .upsert({
              user_id: newUser.user.id,
              bio: 'Experienced consultant providing expert advice and guidance in business strategy, marketing, and technology. 5+ years of experience helping startups scale.',
              tier: 'gold',
              hourly_rate: 150,
              expertise_areas: ['Business Strategy', 'Marketing', 'Technology', 'E-commerce', 'Digital Transformation'],
              is_active: true
            })
            .select()
            .single()

          if (consultantError) {
            console.error('Error creating consultant:', consultantError)
          } else {
            console.log('Consultant created successfully')
            
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
              }
            ]

            const { error: servicesError } = await supabaseClient
              .from('services')
              .insert(sampleServices)

            if (servicesError) {
              console.error('Error creating services:', servicesError)
            } else {
              console.log('Sample services created successfully')
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Demo account created and configured', userId: newUser.user?.id }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Handle existing logic for setting up data for existing users
    if (!userId) {
      throw new Error('User ID is required for existing user setup')
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
        .upsert({
          user_id: userId,
          bio: 'Experienced consultant providing expert advice and guidance in business strategy, marketing, and technology. 5+ years of experience helping startups scale.',
          tier: 'gold',
          hourly_rate: 150,
          expertise_areas: ['Business Strategy', 'Marketing', 'Technology', 'E-commerce', 'Digital Transformation'],
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

      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .insert(sampleServices)
        .select()

      if (servicesError) {
        console.error('Error creating services:', servicesError)
        throw servicesError
      }

      // Create sample conversation with demo buyer if exists
      const { data: buyerProfile } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('email', 'demo-buyer@demo.com')
        .single()

      if (buyerProfile && services && services.length > 0) {
        const { data: conversation, error: convError } = await supabaseClient
          .from('conversations')
          .upsert({
            id: '550e8400-e29b-41d4-a716-446655440100',
            buyer_id: buyerProfile.user_id,
            seller_id: userId,
            service_id: services[0].id,
            status: 'active',
            last_message_at: new Date().toISOString()
          })
          .select()
          .single()

        if (!convError && conversation) {
          // Add sample messages
          const sampleMessages = [
            {
              conversation_id: conversation.id,
              sender_id: userId,
              message_text: "Hi! Thanks for your interest in my business strategy consultation. I'd be happy to help you develop a comprehensive plan for your venture.",
              message_type: 'text',
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
              conversation_id: conversation.id,
              sender_id: buyerProfile.user_id,
              message_text: "That sounds great! I'm looking to expand my e-commerce business and need guidance on market positioning.",
              message_type: 'text',
              created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString()
            },
            {
              conversation_id: conversation.id,
              sender_id: userId,
              message_text: "Perfect! Market positioning is crucial for e-commerce success. Let's schedule a session to dive deep into your target audience and competitive landscape.",
              message_type: 'text',
              created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
            }
          ]

          await supabaseClient
            .from('messages')
            .upsert(sampleMessages)
        }
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
