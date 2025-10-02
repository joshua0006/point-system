import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway with vision model to extract amount
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this receipt image and extract the TOTAL AMOUNT or GRAND TOTAL. Look for words like "Total", "Amount Due", "Grand Total", "Balance Due", or similar. Return ONLY the numeric value as a decimal number without any currency symbols, commas, or text. For example, if the total is $1,234.56, return: 1234.56. If you cannot clearly identify the total amount, return: null'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI Gateway error:', await aiResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to process image', amount: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0]?.message?.content?.trim();
    
    console.log('AI extracted text:', extractedText);

    // Parse the amount
    let amount: number | null = null;
    if (extractedText && extractedText !== 'null') {
      const parsedAmount = parseFloat(extractedText.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        amount = parsedAmount;
      }
    }

    return new Response(
      JSON.stringify({ amount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting receipt amount:', error);
    return new Response(
      JSON.stringify({ error: error.message, amount: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
