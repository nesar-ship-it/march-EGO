import { supabase } from '@/lib/supabase';

export const createCoachNote = async (params: { org_id: string; student_id: string; note_type: string; title?: string; body: string; created_by: string; }) => {
  const { data, error } = await supabase.from('coach_notes').insert(params).select().single();
  return { data, error };
};
