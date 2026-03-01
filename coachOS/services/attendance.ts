import { supabase } from '@/lib/supabase';

export const getAttendanceRecords = async ({
  org_id,
  student_id,
  date_from,
  date_to,
}: {
  org_id: string;
  student_id: string;
  date_from?: string;
  date_to?: string;
}) => {
  let query = supabase
    .from('attendance_records')
    .select('*')
    .eq('org_id', org_id)
    .eq('student_id', student_id);

  if (date_from) query = query.gte('date', date_from);
  if (date_to) query = query.lte('date', date_to);

  const { data, error } = await query;
  return { data, error };
};
