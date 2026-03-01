import { supabase } from '@/lib/supabase';
import { generateSecureToken } from '@/lib/utils';
import { INVITE_DEFAULTS } from '@/lib/constants';

export async function validateInviteToken(token: string) {
  const { data, error } = await supabase
    .from('invites')
    .select('id, org_id, branch_id, role, expires_at, used_count, max_uses, is_active')
    .eq('token', token)
    .single();

  if (error || !data) return { valid: false as const, invite: null };
  if (!data.is_active) return { valid: false as const, invite: null };
  if (new Date(data.expires_at) < new Date()) return { valid: false as const, invite: null };
  if (data.used_count >= data.max_uses) return { valid: false as const, invite: null };

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', data.org_id)
    .single();

  let branch_name: string | null = null;
  if (data.branch_id) {
    const { data: branch } = await supabase
      .from('branches')
      .select('name')
      .eq('id', data.branch_id)
      .single();
    branch_name = branch?.name ?? null;
  }

  return {
    valid: true as const,
    invite: {
      ...data,
      org_name: org?.name ?? 'Academy',
      branch_name,
    },
  };
}

export async function acceptInvite(token: string, authUserId: string, email: string, fullName: string) {
  const { valid, invite } = await validateInviteToken(token);
  if (!valid || !invite) return { error: 'Invalid or expired invite' };

  const { error: profileError } = await supabase.from('staff_profiles').insert({
    auth_user_id: authUserId,
    org_id: invite.org_id,
    branch_id: invite.branch_id,
    role: invite.role,
    full_name: fullName ?? 'Staff',
    email,
    is_active: true,
    access_expires_at: invite.role === 'temp_coach' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  });

  if (profileError) return { error: profileError.message };

  await supabase
    .from('invites')
    .update({
      used_count: invite.used_count + 1,
      is_active: invite.used_count + 1 >= invite.max_uses ? false : undefined,
    })
    .eq('id', invite.id);

  return { error: null };
}

export async function createInvite(params: {
  org_id: string;
  branch_id: string;
  role: 'branch_admin' | 'coach' | 'temp_coach';
  created_by: string;
  max_uses?: number;
  expiry_hours?: number;
}) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (params.expiry_hours ?? INVITE_DEFAULTS.EXPIRY_HOURS));
  const maxUses = params.max_uses ?? INVITE_DEFAULTS.MAX_USES[params.role] ?? 1;
  const token = generateSecureToken();

  const { data, error } = await supabase
    .from('invites')
    .insert({
      org_id: params.org_id,
      branch_id: params.branch_id,
      token,
      role: params.role,
      created_by: params.created_by,
      max_uses: maxUses,
      used_count: 0,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select('id, token, expires_at')
    .single();

  if (error) return { invite: null, error: error.message };
  return { invite: data, error: null };
}
