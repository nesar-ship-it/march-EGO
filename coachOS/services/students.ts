import { supabase } from '@/lib/supabase';

export const createStudent = async (params: any) => {
  const { data, error } = await supabase.from('students').insert(params).select().single();
  return { data, error };
};

export const getStudentById = async ({ student_id, org_id }: { student_id: string; org_id: string }) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', student_id)
    .eq('org_id', org_id)
    .single();
  return { student: data, error };
};

export const resetStudentPassword = async (student_id: string) => {
  return { newPassword: 'temp_password_123', error: null }; // placeholder for Edge Function implementation
};
