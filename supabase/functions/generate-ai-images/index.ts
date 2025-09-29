
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, size = "1024x1024", quality = "standard" } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured in edge function secrets')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase Edge Functions secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Enhance the prompt for professional marketing imagery with character and design focus
    const enhancedPrompt = `Professional marketing character illustration: ${prompt}. Style: Modern vector art illustration, clean cartoon-style character design, professional marketing aesthetic, bright engaging colors, friendly approachable character, optimized for advertising. Composition: Strategic white space for text placement, professional lighting, high contrast, marketing psychology optimized. Art direction: Contemporary illustration style, brand-ready, visually appealing for target demographics, suitable for social media and digital advertising.`
    
    console.log('Generating image with prompt:', enhancedPrompt)
    console.log('Using parameters:', { model: 'dall-e-3', size, quality })

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error response:', errorText)
      let errorMessage = 'Failed to generate image'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorMessage
      } catch (parseError) {
        console.error('Could not parse error response:', parseError)
      }
      
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }

    const data = await response.json()
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error('Unexpected response format:', data)
      throw new Error('Invalid response format from OpenAI API')
    }

    const imageUrl = data.data[0].url

    console.log('Image generated successfully, URL:', imageUrl)

    return new Response(
      JSON.stringify({ 
        image: imageUrl,
        prompt: prompt 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in generate-ai-images function:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
