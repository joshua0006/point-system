import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const taskPrompts = {
  'client-communication': `You are a professional financial consultant's AI assistant specializing in client communication. Help create professional, compliant, and personalized communications including proposals, follow-ups, meeting agendas, and client updates. Ensure all content is appropriate for Singapore's financial services regulatory environment.`,
  
  'content-creation': `You are a financial content creation specialist. Help create educational content, market commentary, financial literacy materials, and compliance-approved content for financial consultants. Focus on topics relevant to Singapore's financial market including CPF, insurance, investments, and estate planning.`,
  
  'lead-generation': `You are a marketing specialist for financial consultants. Help create targeted marketing campaigns, social media content, webinar scripts, and advertising copy for different client segments (NSF personnel, seniors, general public). Ensure all content is compliant with MAS regulations.`,
  
  'compliance': `You are a compliance specialist for Singapore financial services. Help create regulatory-compliant documentation, disclosure statements, compliance checklists, and ensure all content meets MAS requirements. Provide guidance on regulatory compliance for financial consultants.`,
  
  'business-strategy': `You are a business strategy consultant for financial advisory practices. Help with business planning, market analysis, pricing strategies, practice management, and operational optimization specifically for financial consultants in Singapore.`,
  
  'analysis': `You are a financial analysis expert. Help with investment research, economic analysis, product comparisons, risk assessments, and performance reporting for financial consultants and their clients.`,
  
  'tax-estate': `You are a tax and estate planning specialist for Singapore. Help with tax-efficient strategies, estate planning documentation, CPF optimization, insurance needs analysis, and wealth transfer planning compliant with Singapore regulations.`,
  
  'crm': `You are a client relationship management specialist for financial consultants. Help with client segmentation, retention strategies, referral programs, communication templates, and relationship building strategies.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { message, taskCategory, conversationId } = await req.json();

    // Get consultant profile and services in parallel for better performance
    const [profileResult, servicesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, role')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('services')
        .select('title, description, category')
        .eq('consultant_id', user.id)
    ]);

    const profile = profileResult.data;
    const services = servicesResult.data;

    const systemPrompt = taskPrompts[taskCategory as keyof typeof taskPrompts] || taskPrompts['client-communication'];
    
    const contextualPrompt = `${systemPrompt}

Consultant Context:
- Name: ${profile?.full_name || 'Financial Consultant'}
- Role: ${profile?.role || 'consultant'}
- Services Offered: ${services?.map(s => `${s.title} (${s.category})`).join(', ') || 'General financial consulting'}

Important Guidelines:
- All advice must be suitable for Singapore's regulatory environment
- Consider MAS (Monetary Authority of Singapore) compliance requirements
- Be professional, clear, and client-focused
- Provide practical, actionable recommendations
- Include relevant disclaimers when appropriate
- Consider different client segments: NSF personnel, seniors, general public

Please provide helpful, professional assistance for the following request:`;

    console.log('Sending request to OpenAI for task category:', taskCategory);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          { role: 'system', content: contextualPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save the conversation to database
    let conversationIdToUse = conversationId;
    
    if (!conversationIdToUse) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          consultant_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          task_category: taskCategory
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
      } else {
        conversationIdToUse = newConversation.id;
      }
    }

    // Save messages if conversation exists
    if (conversationIdToUse) {
      await supabase.from('ai_messages').insert([
        {
          conversation_id: conversationIdToUse,
          role: 'user',
          content: message
        },
        {
          conversation_id: conversationIdToUse,
          role: 'assistant',
          content: assistantMessage
        }
      ]);
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      conversationId: conversationIdToUse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in consultant-ai-assistant function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});