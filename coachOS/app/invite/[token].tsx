import { useEffect, useState, useRef } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui';
import { validateInviteToken } from '@/services/invites';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { StaffProfile } from '@/lib/types';

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
  const [invite, setInvite] = useState<{
    org_name: string;
    role: string;
    branch_name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const acceptedRef = useRef(false);

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setStatus('invalid');
      return;
    }
    validateInviteToken(token).then(({ valid, invite: inv }) => {
      if (valid && inv) {
        setInvite({
          org_name: inv.org_name,
          role: inv.role,
          branch_name: inv.branch_name ?? null,
        });
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    }).catch(() => setStatus('error'));
  }, [token]);

  const handleContinueWithGoogle = async () => {
    if (!token || !invite) return;
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (signInError) {
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && token && invite && !acceptedRef.current) {
        acceptedRef.current = true;
        const { data, error: invokeError } = await supabase.functions.invoke('accept-invite', {
          body: { token },
        });
        if (invokeError) {
          acceptedRef.current = false;
          return;
        }
        const err = (data as { error?: string })?.error;
        if (err) {
          acceptedRef.current = false;
          return;
        }
        const result = data as { org_id?: string; staff_profile_id?: string };
        const orgId = result?.org_id;
        if (orgId) {
          const { data: staffProfile } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .eq('org_id', orgId)
            .single();
          if (staffProfile) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? undefined,
              role: (staffProfile as StaffProfile).role,
              orgId: (staffProfile as StaffProfile).org_id,
              branchId: (staffProfile as StaffProfile).branch_id,
              profile: staffProfile as StaffProfile,
            });
          }
        }
        router.replace('/(staff)/(home)');
      }
    });
    return () => sub.data.subscription.unsubscribe();
  }, [token, invite, setUser]);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="font-inter-regular text-body-md text-text-secondary">
          Checking invite...
        </Text>
      </View>
    );
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-center font-inter-semibold text-h3 text-text-primary">
          Invalid or expired invite
        </Text>
        <Text className="mt-2 text-center font-inter-regular text-body-md text-text-secondary">
          This invite link may have expired or already been used.
        </Text>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onPress={() => router.replace('/(auth)/login')}
        >
          Go to Login
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-center font-inter-semibold text-h2 text-text-primary">
        You've been invited!
      </Text>
      <Text className="mt-2 text-center font-inter-regular text-body-md text-text-secondary">
        {invite?.org_name} has invited you to join as {invite?.role?.replace(/_/g, ' ')}.
        {invite?.branch_name ? ` (${invite.branch_name})` : ''}
      </Text>
      <View className="mt-8 w-full max-w-[280px]">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinueWithGoogle}
          loading={loading}
        >
          Continue with Google
        </Button>
      </View>
    </View>
  );
}
