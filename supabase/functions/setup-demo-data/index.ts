
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
      console.log('Processing demo account request:', email)
      
      // Only process if it's a demo email
      if (!email.includes('demo-') && !email.endsWith('@demo.com')) {
        return new Response(
          JSON.stringify({ error: 'This function is only for demo accounts' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      // First check if user already exists
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers()
      const existingUser = existingUsers.users?.find(user => user.email === email)
      
      if (existingUser) {
        console.log('User already exists:', email)
        
        // Always confirm email for existing demo accounts
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          existingUser.id,
          { 
            email_confirm: true,
            user_metadata: { full_name: fullName || existingUser.user_metadata?.full_name }
          }
        )
        
        if (updateError) {
          console.error('Error confirming existing user email:', updateError)
          throw updateError
        }
        
        console.log('Email confirmed for existing user:', existingUser.id)
        
        // Set up demo data for existing user if needed
        await setupDemoData(supabaseClient, existingUser.id, email, isConsultant)
        
        return new Response(
          JSON.stringify({ success: true, message: 'Demo account ready', userId: existingUser.id }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
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

        // Set up the user's profile and demo data
        if (newUser.user) {
          await setupDemoData(supabaseClient, newUser.user.id, email, isConsultant)
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Demo account created and configured', userId: newUser.user?.id }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    // Handle existing logic for setting up data for existing users
    if (!userId) {
      throw new Error('User ID is required for existing user setup')
    }

    // Only set up demo data for demo accounts
    if (userEmail && (userEmail.includes('demo-') || userEmail.endsWith('@demo.com'))) {
      await setupDemoData(supabaseClient, userId, userEmail, isConsultant)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Setup complete' }),
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

async function setupDemoData(supabaseClient: any, userId: string, userEmail: string, isConsultant: boolean) {
  console.log('Setting up demo data for user:', userId, 'isConsultant:', isConsultant)
  
  // Only create demo data for demo accounts
  if (!userEmail.includes('demo-') && !userEmail.endsWith('@demo.com')) {
    console.log('Skipping demo data setup for non-demo account:', userEmail)
    return
  }

  // Enhanced profile setup with more realistic data
  const profileUpdates: any = {
    points_balance: isConsultant ? 5000 : 2500,
    avatar_url: getRandomAvatar(userEmail)
  }

  // Determine role based on email - admin emails get admin role
  if (userEmail.includes('admin')) {
    profileUpdates.role = 'admin'
    profileUpdates.bio = getConsultantBio(userEmail)
  } else if (isConsultant) {
    profileUpdates.role = 'consultant'
    profileUpdates.bio = getConsultantBio(userEmail)
  } else {
    profileUpdates.bio = getBuyerBio(userEmail)
  }

  // Update profile with enhanced data
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update(profileUpdates)
    .eq('user_id', userId)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }

  if (isConsultant) {
    // Create comprehensive consultant profile
    const { data: consultant, error: consultantError } = await supabaseClient
      .from('consultants')
      .upsert({
        user_id: userId,
        bio: getDetailedConsultantBio(userEmail),
        tier: getConsultantTier(userEmail),
        hourly_rate: getConsultantRate(userEmail),
        expertise_areas: getExpertiseAreas(userEmail),
        is_active: true,
        calendar_link: `https://calendly.com/${userEmail.split('@')[0]}`
      })
      .select()
      .single()

    if (consultantError) {
      console.error('Error creating consultant:', consultantError)
    } else {
      console.log('Consultant created successfully')
      
      // Create comprehensive services
      const sampleServices = getConsultantServices(consultant.id, userEmail)

      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .upsert(sampleServices)
        .select()

      if (servicesError) {
        console.error('Error creating services:', servicesError)
      } else {
        console.log('Services created successfully:', services?.length)

        // Create historical bookings and transactions
        await createHistoricalData(supabaseClient, userId, consultant.id, services)
      }

      // Create conversations with demo buyers
      await createDemoConversations(supabaseClient, userId, services)
    }
  } else {
    // For buyers, create transaction history
    await createBuyerTransactionHistory(supabaseClient, userId)
    
    // Create bookings history
    await createBuyerBookingHistory(supabaseClient, userId)
  }
}

function getRandomAvatar(email: string): string {
  const avatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b31b1b67?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
  ]
  return avatars[email.charCodeAt(0) % avatars.length]
}

function getConsultantBio(email: string): string {
  if (email.includes('consultant')) return 'Senior business strategist with 15+ years helping Fortune 500 companies and startups scale.'
  if (email.includes('tech')) return 'Former CTO turned consultant. Expert in technology strategy and team building.'
  if (email.includes('marketing')) return 'Growth marketing expert who has scaled 20+ companies from startup to IPO.'
  if (email.includes('finance')) return 'Former investment banker with expertise in financial planning and fundraising.'
  return 'Experienced consultant providing expert advice across multiple business domains.'
}

function getBuyerBio(email: string): string {
  if (email.includes('buyer')) return 'Entrepreneur looking to scale my e-commerce business. Always eager to learn from experts.'
  if (email.includes('marketing')) return 'Marketing director at a growing startup. Passionate about data-driven strategies.'
  if (email.includes('founder')) return 'Serial entrepreneur with multiple successful exits. Always seeking new insights.'
  if (email.includes('startup')) return 'Tech startup founder focused on fintech solutions. Seeking guidance on scaling.'
  return 'Business professional seeking expert guidance for growth and success.'
}

function getDetailedConsultantBio(email: string): string {
  if (email.includes('consultant')) {
    return 'Dr. Jennifer Smith is a renowned business strategist with over 15 years of experience helping both Fortune 500 companies and promising startups achieve their growth objectives. She holds an MBA from Wharton and has successfully guided over 200 companies through strategic transformations.'
  }
  if (email.includes('tech')) {
    return 'David Kumar brings 12 years of hands-on technology leadership experience, having served as CTO for multiple successful startups before transitioning to consulting. He specializes in helping companies make critical technology decisions and build high-performing engineering teams.'
  }
  if (email.includes('marketing')) {
    return 'Lisa Thompson is a growth marketing virtuoso who has played pivotal roles in scaling 20+ companies from early-stage startups to successful IPOs. Her data-driven approach and deep understanding of customer acquisition funnels have generated over $500M in revenue for her clients.'
  }
  if (email.includes('finance')) {
    return 'Robert Chen leveraged his 10 years as an investment banker at Goldman Sachs to become one of the most sought-after financial consultants for startups and growth-stage companies. He has helped raise over $2B in funding across various industries.'
  }
  return 'Experienced consultant with deep expertise in business strategy, operations, and growth acceleration.'
}

function getConsultantTier(email: string): string {
  if (email.includes('consultant') || email.includes('finance')) return 'platinum'
  if (email.includes('tech') || email.includes('marketing')) return 'gold'
  return 'silver'
}

function getConsultantRate(email: string): number {
  if (email.includes('consultant')) return 250
  if (email.includes('finance')) return 300
  if (email.includes('tech')) return 200
  if (email.includes('marketing')) return 180
  return 150
}

function getExpertiseAreas(email: string): string[] {
  if (email.includes('consultant')) return ['Business Strategy', 'Operations', 'Leadership', 'Scale-up', 'Digital Transformation']
  if (email.includes('tech')) return ['Technology Strategy', 'Team Building', 'Architecture', 'DevOps', 'Product Development']
  if (email.includes('marketing')) return ['Growth Marketing', 'Digital Strategy', 'Customer Acquisition', 'Analytics', 'Brand Building']
  if (email.includes('finance')) return ['Financial Planning', 'Fundraising', 'M&A Strategy', 'Valuation', 'Investment Strategy']
  return ['Business Strategy', 'Marketing', 'Technology', 'Operations']
}

function getConsultantServices(consultantId: string, email: string): any[] {
  const baseServices = [
    {
      consultant_id: consultantId,
      title: 'Strategic Planning Workshop',
      description: 'Comprehensive 2-hour workshop to develop your long-term business strategy and roadmap for success.',
      price: 500,
      duration_minutes: 120,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'
    },
    {
      consultant_id: consultantId,
      title: 'Executive Coaching Session',
      description: 'One-on-one leadership coaching to help you develop executive presence and decision-making skills.',
      price: 250,
      duration_minutes: 60,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop'
    }
  ]

  if (email.includes('tech')) {
    baseServices.push(
      {
        consultant_id: consultantId,
        title: 'Tech Stack Architecture Review',
        description: 'Comprehensive review of your technology architecture with recommendations for optimization and scaling.',
        price: 300,
        duration_minutes: 90,
        category_id: '550e8400-e29b-41d4-a716-446655440002',
        image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop'
      },
      {
        consultant_id: consultantId,
        title: 'CTO Advisory Package',
        description: 'Monthly advisory package for CTOs and tech leaders to navigate complex technology decisions.',
        price: 800,
        duration_minutes: 120,
        category_id: '550e8400-e29b-41d4-a716-446655440002',
        image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop'
      }
    )
  }

  if (email.includes('marketing')) {
    baseServices.push(
      {
        consultant_id: consultantId,
        title: 'Growth Marketing Audit',
        description: 'Complete audit of your marketing funnel with actionable recommendations for growth.',
        price: 350,
        duration_minutes: 90,
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop'
      },
      {
        consultant_id: consultantId,
        title: 'Customer Acquisition Workshop',
        description: 'Intensive workshop on building scalable customer acquisition systems.',
        price: 450,
        duration_minutes: 120,
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'
      }
    )
  }

  if (email.includes('finance')) {
    baseServices.push(
      {
        consultant_id: consultantId,
        title: 'Fundraising Strategy Session',
        description: 'Strategic guidance on preparing for and executing successful fundraising rounds.',
        price: 500,
        duration_minutes: 90,
        category_id: '550e8400-e29b-41d4-a716-446655440003',
        image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'
      },
      {
        consultant_id: consultantId,
        title: 'M&A Advisory Session',
        description: 'Expert guidance on mergers, acquisitions, and strategic partnerships.',
        price: 600,
        duration_minutes: 120,
        category_id: '550e8400-e29b-41d4-a716-446655440003',
        image_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=200&fit=crop'
      }
    )
  }

  return baseServices
}

async function createHistoricalData(supabaseClient: any, userId: string, consultantId: string, services: any[]) {
  // Create sample bookings
  const bookings = [
    {
      user_id: 'demo-user-1',
      consultant_id: consultantId,
      service_id: services[0]?.id,
      status: 'completed',
      points_spent: services[0]?.price || 250,
      scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Excellent session! Really helped clarify our business direction.',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  // Create earnings transactions
  const transactions = [
    {
      user_id: userId,
      type: 'earning',
      amount: Math.floor((services[0]?.price || 250) * 0.8),
      description: `Earnings from ${services[0]?.title || 'consultation'}`,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: userId,
      type: 'initial_credit',
      amount: 1000,
      description: 'Welcome bonus for new consultants',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  await supabaseClient.from('points_transactions').upsert(transactions)
}

async function createDemoConversations(supabaseClient: any, userId: string, services: any[]) {
  if (!services || services.length === 0) return

  const conversation = {
    id: `conv-${userId.slice(-8)}`,
    buyer_id: 'demo-buyer-placeholder',
    seller_id: userId,
    service_id: services[0].id,
    status: 'active',
    last_message_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }

  const { data: conv } = await supabaseClient
    .from('conversations')
    .upsert(conversation)
    .select()
    .single()

  if (conv) {
    const messages = [
      {
        conversation_id: conv.id,
        sender_id: userId,
        message_text: "Hi! Thanks for your interest in my consulting services. I'd be happy to help you achieve your business goals.",
        message_type: 'text',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        conversation_id: conv.id,
        sender_id: 'demo-buyer-placeholder',
        message_text: "That sounds great! I'm looking for guidance on scaling my business.",
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]

    await supabaseClient.from('messages').upsert(messages)
  }
}

async function createBuyerTransactionHistory(supabaseClient: any, userId: string) {
  const transactions = [
    {
      user_id: userId,
      type: 'initial_credit',
      amount: 3000,
      description: 'Welcome bonus for new users',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: userId,
      type: 'purchase',
      amount: 2000,
      description: 'Points purchase - Premium package',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  await supabaseClient.from('points_transactions').upsert(transactions)
}

async function createBuyerBookingHistory(supabaseClient: any, userId: string) {
  // This would create booking history but we'll skip for now since it requires existing consultants
  console.log('Buyer booking history creation skipped - requires existing consultants')
}
