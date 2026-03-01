import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import type { StaffProfile } from '@/lib/types';

export default function Index() {
  const [authError, setAuthError] = useState(false);
  const [staffProfiles, setStaffProfiles] = useState<{ profile: StaffProfile; orgName: string }[] | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setAuthError(false);
    setStaffProfiles(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .order('org_id');

      if (profiles && profiles.length > 0) {
        if (profiles.length === 1) {
          const sp = profiles[0] as StaffProfile;
          setUser({
            id: session.user.id,
            email: session.user.email ?? undefined,
            role: sp.role,
            orgId: sp.org_id,
            branchId: sp.branch_id ?? null,
            profile: sp,
          });
          router.replace('/(staff)/(home)');
          return;
        }
        const selectedOrgId = storage.getString(STORAGE_KEYS.SELECTED_ORG_ID);
        const selected = profiles.find((p) => p.org_id === selectedOrgId) as StaffProfile | undefined;
        if (selected) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? undefined,
            role: selected.role,
            orgId: selected.org_id,
            branchId: selected.branch_id ?? null,
            profile: selected,
          });
          router.replace('/(staff)/(home)');
          return;
        }
        const orgIds = [...new Set(profiles.map((p) => p.org_id))];
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
        const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));
        setStaffProfiles(
          profiles.map((p) => ({
            profile: p as StaffProfile,
            orgName: orgMap.get(p.org_id) ?? 'Academy',
          }))
        );
        return;
      }

      const { data: student } = await supabase
        .from('students')
        .select('id, org_id')
        .eq('auth_user_id', session.user.id)
        .eq('enrollment_status', 'active')
        .maybeSingle();

      if (student) {
        router.replace('/(student)');
        return;
      }

      router.replace('/(auth)/onboarding/org-details');
    } catch {
      setAuthError(true);
    }
  }

  const handleSelectOrg = async (profile: StaffProfile) => {
    storage.set(STORAGE_KEYS.SELECTED_ORG_ID, profile.org_id);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email ?? undefined,
        role: profile.role,
        orgId: profile.org_id,
        branchId: profile.branch_id ?? null,
        profile,
      });
    }
    router.replace('/(staff)/(home)');
  };

  if (staffProfiles && staffProfiles.length > 1) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center font-inter-semibold text-h3 text-text-primary">
          Select academy
        </Text>
        <Text className="mt-2 text-center font-inter-regular text-body-md text-text-secondary">
          You have access to multiple academies. Choose one to continue.
        </Text>
        <View className="mt-6 w-full max-w-sm gap-2">
          {staffProfiles.map(({ profile, orgName }) => (
            <Pressable
              key={profile.org_id}
              onPress={() => handleSelectOrg(profile)}
              className="rounded-lg border border-border-default bg-bg-secondary p-4"
            >
              <Text className="font-inter-semibold text-body-md text-text-primary">{orgName}</Text>
              <Text className="mt-0.5 font-inter-regular text-caption text-text-tertiary">
                {profile.role.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (authError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center font-inter-regular text-body-md text-text-secondary">
          Could not check session. Check your connection and try again.
        </Text>
        <Button variant="primary" size="md" className="mt-4" onPress={() => checkAuth()}>
          Retry
        </Button>
        <Button variant="ghost" size="md" className="mt-2" onPress={() => router.replace('/(auth)/login')}>
          Go to login
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0A0A0A" />
    </View>
  );
}
