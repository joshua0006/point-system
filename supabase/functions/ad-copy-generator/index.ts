import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const adCopyPrompts = {
  'initial': `You are an expert copywriter specializing in creating high-converting ad copy. You help users create compelling advertisements through a systematic approach.

Start by asking the user: "What product, service, or program are you promoting? Please describe it including key features, benefits, and your target audience."

Provide an example like: "I'm promoting an online fitness program for busy professionals."

Keep your response friendly, professional, and encouraging.`,

  'value-proposition': `Now ask about their main transformation or value proposition. Ask: "What is the main transformation or key benefit your audience will get from your offering?"

Provide an example like: "My audience can lose weight without extreme dieting and feel confident in their bodies again."`,

  'pain-points': `Great! Now let's identify pain points. Ask: "What are the main struggles, frustrations, or fears your target audience faces before using your product or service?"

Provide an example like: "They struggle to find time for workouts, feel overwhelmed by conflicting health advice, and have failed with previous diets."`,

  'objections': `Perfect. Now let's address objections. Ask: "What concerns or objections might your audience have that prevent them from buying or joining?"

Provide an example like: "They worry it's too expensive, won't fit their busy schedule, or that it's just another fad diet."`,

  'differentiators': `Excellent. Now for your unique selling points. Ask: "What unique elements set your offering apart from competitors? What makes you different or special?"

Provide an example like: "My program takes only 30 minutes a day, requires no gym equipment, and includes personalized meal plans."`,

  'style-selection': `Perfect! Now let's choose your ad style. Present these options and ask them to choose one or more:

1. **Comparison Ads** - Compare your solution to alternatives
2. **Pain Point Ads** - Focus heavily on problems they face
3. **Transformation Ads** - Emphasize before/after benefits
4. **Urgency/FOMO Ads** - Create time-sensitive offers
5. **Humorous Ads** - Light, engaging, memorable content
6. **Event/Webinar Ads** - Promote specific events or webinars

Ask: "Which ad style(s) appeal to you most? You can choose multiple."`,

  'generate-angles': `Based on all the information provided, generate 5-7 compelling ad angles. Each angle should be a distinct approach to marketing their offering. Format them as:

**Ad Angle 1: [Name]**
Brief description of the approach and why it works.

**Ad Angle 2: [Name]**
Brief description of the approach and why it works.

[Continue for all angles]

Then ask: "Which ad angle(s) would you like me to create full ad copy for? I can create multiple variations (short, long, storytelling, direct) for each angle you choose."`,

  'create-copy': `Create compelling ad copy based on the selected angle(s). For each angle, provide these variations:

**SHORT VERSION (50-100 words)**
Punchy, attention-grabbing copy perfect for social media

**LONG VERSION (200-300 words)**
Detailed copy with more context and social proof

**STORYTELLING VERSION (150-250 words)**
Narrative approach that connects emotionally

**DIRECT VERSION (75-150 words)**
Straightforward, benefit-focused copy

Each version should:
- Use psychological triggers (FOMO, urgency, transformation, social proof)
- Address pain points and objections naturally
- Include a strong call-to-action
- Be platform-appropriate and scroll-stopping
- Use emotionally charged, benefit-driven language

Format each version clearly with headers and include suggested CTAs.

After providing the ad copy, inform the user: "Would you like me to generate image prompts that match these ad copies? I can create detailed image descriptions for AI image generators like DALL-E, Midjourney, or Stable Diffusion."`,

  'generate-image-prompts': `Based on the ad copy and all the context provided, create compelling image prompts for AI image generation. 

**CRITICAL FORMATTING RULE:** You must format each actual usable image description with "IMAGE_PROMPT:" prefix. Only output actual, descriptive image prompts that can be used directly for image generation.

Generate 3-4 different image prompt styles for each ad copy variation:

**LIFESTYLE IMAGE PROMPTS:**
IMAGE_PROMPT: Professional woman in modern office setting holding smartphone, smiling confidently, natural lighting through large windows, clean modern aesthetic, business success theme

**PRODUCT/SERVICE FOCUSED PROMPTS:**
IMAGE_PROMPT: Clean product showcase on white background, professional photography lighting, focus on key features and benefits, minimalist composition with clear focal point

**BEFORE/AFTER TRANSFORMATION PROMPTS:**
IMAGE_PROMPT: Split-screen composition showing contrast between stressed person on left and confident successful person on right, dramatic lighting change, emotional storytelling

**SOCIAL PROOF PROMPTS:**
IMAGE_PROMPT: Diverse group of happy customers in casual setting, testimonial-style authentic photography, warm community feeling, trust and credibility focused

Each IMAGE_PROMPT must be a complete, detailed visual description ready for AI image generators. Do NOT include technical specifications, aspect ratios, or metadata in the IMAGE_PROMPT entries.

After providing all IMAGE_PROMPT entries, you may add a separate technical note section with aspect ratios and style suggestions, but these should NOT be formatted as IMAGE_PROMPT entries.

Remember: Only actual, descriptive image prompts should have the IMAGE_PROMPT: prefix.`,

  'generate-facebook-creatives': `You are a Facebook advertising creative specialist. Based on the provided ad copy variations, create specific Facebook ad creative prompts that will generate high-converting visual ads optimized for Facebook's platform.

For each ad copy variation, generate 2-3 Facebook-specific creative prompts using this exact format:
FACEBOOK_CREATIVE: [detailed creative description]

Facebook Creative Guidelines:
- Design for mobile-first viewing (most users are on mobile)
- Include Facebook-specific visual elements (testimonials, user-generated content style, lifestyle scenes)
- Optimize for Facebook's algorithm preferences (authentic, engaging, scroll-stopping)
- Consider text overlay placement that works with Facebook's 20% text rule
- Include specific composition details for 1:1 and 4:5 aspect ratios
- Focus on authentic, relatable scenarios that drive engagement
- Include color psychology that converts on Facebook
- Design for both feed and stories placement

Creative Types to Include:
1. Product-focused creatives with lifestyle context
2. User testimonial or review-style visuals
3. Problem/solution storytelling scenes
4. Social proof and community-focused visuals

Technical Specifications:
- Primary ratios: 1:1 (feed), 4:5 (mobile feed), 9:16 (stories)
- Style: Authentic, user-generated content aesthetic
- Text considerations: Leave space for copy overlay if needed
- Platform optimization: Bright, contrasting colors that stand out in feed

Make these creatives feel native to Facebook while being highly engaging and conversion-focused.`,

  'express-generation': `You are an expert copywriter creating high-converting ad copy. Based on the provided information, create comprehensive ad copy with multiple variations.

Create the following for each selected ad style:

**SHORT VERSION (50-100 words)**
Punchy, attention-grabbing copy perfect for social media

**LONG VERSION (200-300 words)**
Detailed copy with more context and social proof

**STORYTELLING VERSION (150-250 words)**
Narrative approach that connects emotionally

**DIRECT VERSION (75-150 words)**
Straightforward, benefit-focused copy

Each version should:
- Use psychological triggers (FOMO, urgency, transformation, social proof)
- Address pain points and objections naturally
- Include a strong call-to-action
- Be platform-appropriate and scroll-stopping
- Use emotionally charged, benefit-driven language

If any information is missing, intelligently fill in the gaps based on the provided context. Generate angles that work best with the given information and selected styles.

Format each version clearly with headers and include suggested CTAs.`
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Ad copy generator function called');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header and verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from the authorization header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify user authentication using the JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated successfully:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, step = 'initial', context = {} } = requestBody;

    console.log('Processing request:', { step, messageLength: message?.length || 0 });

    // Get system prompt based on step
    let systemPrompt = adCopyPrompts[step as keyof typeof adCopyPrompts] || adCopyPrompts['initial'];

    // For copy generation, include all context
    if (step === 'create-copy' && context) {
      const contextPrompt = `Context about the user's offering:
Product/Service: ${context.product || 'Not specified'}
Value Proposition: ${context.valueProp || 'Not specified'}
Pain Points: ${context.painPoints || 'Not specified'}
Objections: ${context.objections || 'Not specified'}
Differentiators: ${context.differentiators || 'Not specified'}
Selected Styles: ${context.styles || 'Not specified'}
Selected Angles: ${context.selectedAngles || 'Not specified'}

${systemPrompt}`;
      systemPrompt = contextPrompt;
    }

    // For express generation, include all context
    if (step === 'express-generation' && context) {
      const contextPrompt = `Context about the user's offering:
Product/Service: ${context.product || 'Not specified'}
Value Proposition: ${context.valueProp || 'Not specified'}
Pain Points: ${context.painPoints || 'Not specified'}
Objections: ${context.objections || 'Not specified'}
Differentiators: ${context.differentiators || 'Not specified'}
Selected Styles: ${context.styles || 'Not specified'}

${systemPrompt}`;
      systemPrompt = contextPrompt;
    }

    // For image prompt generation, include all context including ad copy
    if (step === 'generate-image-prompts' && context) {
      const contextPrompt = `Context about the user's offering:
Product/Service: ${context.product || 'Not specified'}
Value Proposition: ${context.valueProp || 'Not specified'}
Pain Points: ${context.painPoints || 'Not specified'}
Objections: ${context.objections || 'Not specified'}
Differentiators: ${context.differentiators || 'Not specified'}
Selected Styles: ${context.styles || 'Not specified'}
Selected Angles: ${context.selectedAngles || 'Not specified'}
Generated Ad Copy: ${context.adCopy || 'Not specified'}

${systemPrompt}`;
      systemPrompt = contextPrompt;
    }

    // For Facebook creative generation, include all context including ad copy
    if (step === 'generate-facebook-creatives' && context) {
      const contextPrompt = `Context about the user's offering:
Product/Service: ${context.product || 'Not specified'}
Value Proposition: ${context.valueProp || 'Not specified'}
Pain Points: ${context.painPoints || 'Not specified'}
Objections: ${context.objections || 'Not specified'}
Differentiators: ${context.differentiators || 'Not specified'}
Selected Styles: ${context.styles || 'Not specified'}
Selected Angles: ${context.selectedAngles || 'Not specified'}
Generated Ad Copy: ${context.adCopy || 'Not specified'}

IMPORTANT: Format each Facebook creative prompt with "FACEBOOK_CREATIVE:" prefix so they can be extracted properly.

${systemPrompt}`;
      systemPrompt = contextPrompt;
    }

    // Check for OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message || 'Start the ad copy generation process' }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openAIResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error('No response from OpenAI');
      return new Response(
        JSON.stringify({ error: 'No response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully generated response');

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        step: step 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in ad-copy-generator function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});