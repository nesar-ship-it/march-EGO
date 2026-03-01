import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id } = await req.json()
    if (!payment_id) throw new Error('payment_id is required')

    // Initialize Supabase admin client to bypass RLS for PDF upload
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, student:students(*), branch:branches(*), org:organizations(*)')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) throw new Error('Payment not found')

    // 2. Generate PDF content (simplistic text-based approach for Deno Edge Functions)
    // A robust solution would use an external PDF generation API or a pure-JS Deno-compatible PDF library
    // For this scaffold, we're generating a very simple HTML structure that the client could render,
    // or simulate uploading a basic text file acting as a receipt.
    const receiptContent = `
RECEIPT
---------------------------------
Academy: ${payment.org.name}
Branch: ${payment.branch.name}
---------------------------------
Student: ${payment.student.first_name} ${payment.student.last_name || ''}
ID: ${payment.student.student_id_code}
---------------------------------
Amount Paid: INR ${payment.amount}
Period: ${payment.period_label}
Date: ${new Date().toLocaleDateString()}
Method: ${payment.payment_method || 'Online'}
---------------------------------
This is a computer-generated receipt.
    `.trim()

    // 3. Upload to Supabase Storage (storing as text/plain for simplicity in this scaffold)
    const fileName = `${payment.org_id}/${payment_id}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, receiptContent, {
        contentType: 'text/plain',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName)

    // 4. Update payment record with the invoice URL
    const { error: updateError } = await supabase
      .from('payments')
      .update({ invoice_url: publicUrl })
      .eq('id', payment_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, invoice_url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
