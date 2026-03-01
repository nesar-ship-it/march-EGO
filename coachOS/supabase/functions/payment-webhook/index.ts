import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
// Using a web crypto HMAC implementation for webhook signature verification
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const REZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

    if (!signature || !REZORPAY_WEBHOOK_SECRET) {
      throw new Error('Missing signature or secret')
    }

    // Verify webhook signature using HMAC-SHA256
    const expectedSignature = hmac("sha256", REZORPAY_WEBHOOK_SECRET, rawBody, "utf8", "hex")
    
    if (expectedSignature !== signature) {
        return new Response('Invalid signature', { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    
    // We only care about payment_link.paid events
    if (payload.event === 'payment_link.paid') {
        const paymentLinkId = payload.payload.payment_link.entity.id
        const orderId = payload.payload.payment_link.entity.order_id
        const amountPaid = payload.payload.payment_link.entity.amount_paid / 100 // Convert paise to INR

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Find the corresponding payment in our database
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .eq('razorpay_payment_link_id', paymentLinkId)
            .single()

        if (fetchError || !payment) {
            console.error('Payment record not found for link:', paymentLinkId)
            return new Response('Payment record not found', { status: 200 }) // Return 200 so Razorpay stops retrying
        }

        if (payment.status === 'paid') {
             return new Response('Payment already processed', { status: 200 })
        }

        // Update payment status
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                razorpay_payment_id: orderId, // Or extract actual payment ID from payload
                payment_method: 'razorpay'
            })
            .eq('id', payment.id)

        if (updateError) {
             console.error('Failed to update payment status:', updateError)
             throw updateError
        }

        // Note: We would ideally trigger generate-invoice and send-whatsapp here
    }

    return new Response(JSON.stringify({ received: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
