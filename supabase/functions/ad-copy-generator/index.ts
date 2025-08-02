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

Format each version clearly with headers and include suggested CTAs.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error('Authentication failed - no user found');
      throw new Error('Not authenticated');
    }

    const { message, step, context } = await req.json();

    // Determine which prompt to use based on step
    let systemPrompt = adCopyPrompts[step as keyof typeof adCopyPrompts] || adCopyPrompts['initial'];

    // For copy generation, include all context
    if (step === 'create-copy') {
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

    console.log(`Generating ad copy response for step: ${step}`);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;

    console.log('Successfully generated ad copy response');

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        step: step 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ad-copy-generator function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});