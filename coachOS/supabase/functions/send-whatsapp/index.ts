import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppPayload {
  recipient_phone: string;
  template_name: string;
  template_params: Record<string, string>;
  org_id: string;
  branch_id?: string;
  message_type: string;
  sent_by?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: WhatsAppPayload = await req.json()
    const { recipient_phone, template_name, template_params } = payload

    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      throw new Error('WhatsApp credentials not configured')
    }

    // Format phone number (ensure country code, remove non-digits)
    const formattedPhone = recipient_phone.replace(/\D/g, '')

    // Convert template parameters to Meta's format
    // This assumes all parameters are text components in the body for simplicity
    const components = [
      {
        type: "body",
        parameters: Object.keys(template_params).map(key => ({
            type: "text",
            text: template_params[key]
        }))
      }
    ]

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: template_name,
            language: { code: 'en' },
            components: Object.keys(template_params).length > 0 ? components : []
          }
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
       console.error("WhatsApp API Error:", result)
       throw new Error(`WhatsApp API Error: ${result.error?.message || 'Unknown error'}`)
    }

    // Note: Logging to the database (whatsapp_logs) should ideally happen here 
    // using the Supabase client and the service role key.
    
    return new Response(
      JSON.stringify({ success: true, messageId: result.messages?.[0]?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
