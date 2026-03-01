import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { StaffProfile } from '@/lib/types';

const STUDENT_EMAIL_SUFFIX = '@students.coachOS.internal';

export function useAuth() {
  const { user, setUser, clear } = useAuthStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        clear();
        return;
      }
      if (!session?.user) return;

      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffProfile) {
        const sp = staffProfile as StaffProfile;
        if (sp.role === 'temp_coach' && sp.access_expires_at) {
          if (new Date(sp.access_expires_at) < new Date()) {
            await supabase.auth.signOut();
            clear();
            return;
          }
        }
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          role: sp.role,
          orgId: sp.org_id,
          branchId: sp.branch_id,
          profile: sp,
        });
        return;
      }

      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .eq('enrollment_status', 'active')
        .maybeSingle();

      if (student) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? undefined,
          role: 'student',
          orgId: student.org_id,
          branchId: student.branch_id ?? null,
          profile: student,
        });
        return;
      }

      // No staff and no active student (e.g. paused/archived) — sign out so user sees login
      await supabase.auth.signOut();
      clear();
    });

    return () => subscription.unsubscribe();
  }, [setUser, clear]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    return { error };
  };

  const signInAsStudent = async (username: string, password: string) => {
    const email = `${username.trim().toLowerCase()}${STUDENT_EMAIL_SUFFIX}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clear();
  };

  return {
    user,
    signInWithGoogle,
    signInAsStudent,
    signOut,
    isStaff: user?.role && user.role !== 'student',
    isStudent: user?.role === 'student',
  };
}

export { STUDENT_EMAIL_SUFFIX };
