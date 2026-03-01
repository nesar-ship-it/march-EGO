import { supabase } from '@/lib/supabase';

export const getAuditLogs = async (orgId: string, filter?: any, limit: number = 50) => {
  let query = supabase
    .from('audit_logs')
    .select('*, actor:staff_profiles(full_name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filter?.action_type) {
    query = query.eq('action_type', filter.action_type);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
};
