// parent-onboarding: Public endpoint; validate token, update student (service role)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' },
    });
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseService) return Response.json({ error: 'Server not configured' }, { status: 500 });

    const body = await req.json();
    const {
      token,
      parent_name,
      parent_relationship,
      parent_phone,
      guardian_name,
      guardian_phone,
      address,
      city,
      school_name,
      school_grade,
      gender,
      health_notes,
      special_needs,
      uniform_size,
      uniform_gender,
    } = body;

    if (!token || !parent_name || !parent_phone || !address || !city || !school_name || !school_grade || !gender || !uniform_size || !uniform_gender) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, supabaseService);
    const { data: student, error: findErr } = await admin
      .from('students')
      .select('id, first_name, last_name, org_id')
      .eq('parent_onboarding_token', token)
      .single();
    if (findErr || !student) {
      return Response.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const phone = String(parent_phone).replace(/\D/g, '');
    const { error: updateErr } = await admin
      .from('students')
      .update({
        parent_name: (parent_name as string).trim(),
        parent_relationship: (parent_relationship as string)?.trim() || null,
        parent_phone: phone,
        guardian_name: (guardian_name as string)?.trim() || null,
        guardian_phone: guardian_phone ? String(guardian_phone).replace(/\D/g, '') : null,
        address: (address as string).trim(),
        city: (city as string).trim(),
        school_name: (school_name as string).trim(),
        school_grade: (school_grade as string).trim(),
        gender: gender as string,
        health_notes: (health_notes as string)?.trim() || null,
        special_needs: (special_needs as string)?.trim() || null,
        uniform_size: (uniform_size as string).trim(),
        uniform_gender: uniform_gender as string,
        profile_status: 'complete',
        parent_onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', student.id)
      .eq('parent_onboarding_token', token);
    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    await admin.from('audit_logs').insert({
      org_id: student.org_id,
      branch_id: null,
      actor_id: null,
      actor_role: null,
      action: 'student.parent_onboarding_complete',
      entity_type: 'student',
      entity_id: student.id,
      details: {},
    });

    const studentName = `${student.first_name}${student.last_name ? ' ' + student.last_name : ''}`;
    return Response.json({ success: true, student_name: studentName });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
