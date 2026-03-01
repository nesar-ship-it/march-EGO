import { supabase } from '@/lib/supabase';

export const getPayments = async ({
  org_id,
  student_id,
  period_label,
}: {
  org_id: string;
  student_id?: string;
  period_label?: string;
}) => {
  let query = supabase.from('payments').select('*, students(full_name, id)').eq('org_id', org_id);

  if (student_id) {
    query = query.eq('student_id', student_id);
  }
  
  if (period_label) {
    query = query.eq('period_label', period_label);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};
export const getOverduePaymentCount = async (orgId: string, branchId?: string) => { return { count: 0 } };
