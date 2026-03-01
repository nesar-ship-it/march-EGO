import { supabase } from '@/lib/supabase';
import type { ParentOnboardingForm } from '@/lib/types';

export async function validateParentOnboardingToken(token: string) {
  const { data, error } = await supabase
    .from('students')
    .select(
      'id, first_name, last_name, student_id_code, parent_phone, parent_onboarding_completed_at'
    )
    .eq('parent_onboarding_token', token)
    .single();

  if (error || !data) return { valid: false as const, student: null };
  return { valid: true as const, student: data };
}

export async function completeParentOnboarding(
  token: string,
  form: ParentOnboardingForm
) {
  const { valid, student } = await validateParentOnboardingToken(token);
  if (!valid || !student) return { error: 'Invalid or expired link' };

  const { data, error } = await supabase.functions.invoke('parent-onboarding', {
    body: {
      token,
      parent_name: form.parent_name,
      parent_relationship: form.parent_relationship,
      parent_phone: form.parent_phone.replace(/\D/g, ''),
      guardian_name: form.guardian_name ?? undefined,
      guardian_phone: form.guardian_phone
        ? form.guardian_phone.replace(/\D/g, '')
        : undefined,
      address: form.address,
      city: form.city,
      school_name: form.school_name,
      school_grade: form.school_grade,
      gender: form.gender,
      health_notes: form.health_notes ?? undefined,
      special_needs: form.special_needs ?? undefined,
      uniform_size: form.uniform_size,
      uniform_gender: form.uniform_gender,
    },
  });

  if (error) return { error: error.message };
  const err = (data as { error?: string })?.error;
  if (err) return { error: typeof err === 'string' ? err : 'Failed to save' };
  return {
    error: null,
    studentName: (data as { student_name?: string })?.student_name ?? `${student.first_name}${student.last_name ? ` ${student.last_name}` : ''}`,
  };
}
