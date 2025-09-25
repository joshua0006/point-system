import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceTitle, description, consultantName, consultantTier, category } = await req.json();

    const prompt = `Generate 3 personalized first-time messages for a buyer who just booked a consultation service. 

Service Details:
- Title: ${serviceTitle}
- Description: ${description}
- Consultant: ${consultantName} (${consultantTier} tier)
- Category: ${category || 'General'}

Guidelines:
- Messages should be professional but friendly
- 1-2 sentences each
- Focus on preparation, goals, or next steps
- Reflect the service type and consultant expertise level
- Show enthusiasm about the upcoming session

Return as JSON array with "message" field for each suggestion.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional communication assistant that generates appropriate first messages between service buyers and consultants. Always return valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response');
    }

    let generatedMessages;
    try {
      generatedMessages = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response format
    if (!Array.isArray(generatedMessages) || generatedMessages.length !== 3) {
      throw new Error('Invalid message format from AI');
    }

    // Ensure each message has the expected structure
    const validatedMessages = generatedMessages.map((msg, index) => ({
      message: msg.message || `Message ${index + 1} generated successfully`
    }));

    return new Response(JSON.stringify({ messages: validatedMessages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-booking-messages function:', error);
    
    // Fallback messages if AI fails
    const fallbackMessages = [
      { message: "Hi! I'm excited about our upcoming session. What should I prepare beforehand?" },
      { message: "Hello! Could you share some background materials or resources before we meet?" },
      { message: "Hi! I'd like to discuss my specific goals for this session. When would be a good time to chat?" }
    ];

    return new Response(JSON.stringify({ 
      messages: fallbackMessages,
      fallback: true,
      error: error instanceof Error ? error.message : String(error) 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});