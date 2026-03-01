import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/contexts/ToastContext';
import type { StaffProfile } from '@/lib/types';

interface InviteLink {
  email: string;
  url: string;
}

export default function CompleteScreen() {
  useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const { showToast } = useToast();
  const store = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);

  const handleComplete = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) {
      setError('Not signed in.');
      return;
    }
    setError(null);
    setLoading(true);
    const body = {
      org_name: store.orgDetails.name.trim(),
      sport_type: (store.orgDetails.sport_type || store.orgDetails.sport_type_other || 'cricket').trim(),
      branches: store.branches.map((b) => ({
        name: b.name,
        address: b.address || '',
        city: b.city || '',
        phone: b.phone || '',
      })),
      batches: store.batches.map((b) => ({
        name: b.name,
        start_time: b.start_time || null,
        end_time: b.end_time || null,
        days_of_week: b.days_of_week,
      })),
      age_groups: store.ageGroups.map((a) => ({
        name: a.name,
        min_age: a.min_age,
        max_age: a.max_age,
        gender: a.gender,
      })),
      cofounder_emails: store.cofounderEmails.filter((e) => e.trim()).map((e) => e.trim().toLowerCase()),
    };

    const { data, error: invokeError } = await supabase.functions.invoke('create-organization', { body });
    setLoading(false);

    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    const err = (data as { error?: string })?.error;
    if (err) {
      setError(typeof err === 'string' ? err : 'Failed to create academy');
      return;
    }

    const result = data as { org_id?: string; invite_links?: InviteLink[] };
    const orgId = result?.org_id;
    if (!orgId) {
      setError('Invalid response from server');
      return;
    }

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
    store.reset();
    setInviteLinks(Array.isArray(result.invite_links) ? result.invite_links : []);
    setCompleted(true);
  };

  const handleCopyInvite = (url: string) => {
    Clipboard.setStringAsync(url);
    showToast('Link copied', 'success');
  };

  const handleGoToDashboard = () => {
    router.replace('/(staff)/(home)');
  };

  if (completed) {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Academy created
        </Text>
        <Text className="mt-2 font-inter-regular text-body-md text-text-secondary">
          Your academy is ready. Share the links below with co-founders to invite them.
        </Text>
        {inviteLinks.length > 0 ? (
          <View className="mt-6 gap-3">
            <Text className="font-inter-medium text-label-md text-text-secondary">
              Invite links
            </Text>
            {inviteLinks.map((link) => (
              <View
                key={link.email}
                className="rounded-lg border border-border-default bg-bg-secondary p-3"
              >
                <Text className="font-inter-regular text-caption text-text-tertiary">
                  {link.email}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onPress={() => handleCopyInvite(link.url)}
                >
                  Copy link
                </Button>
              </View>
            ))}
          </View>
        ) : null}
        <Button variant="primary" size="lg" fullWidth className="mt-8" onPress={handleGoToDashboard}>
          Go to Dashboard
        </Button>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="font-inter-semibold text-h2 text-text-primary">
        You're all set
      </Text>
      <Text className="mt-2 font-inter-regular text-body-md text-text-secondary">
        Review and create your academy. Co-founders will receive invite links after creation.
      </Text>

      {error && (
        <Text className="mt-4 font-inter-regular text-caption text-status-error">
          {error}
        </Text>
      )}

      <View className="mt-10">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleComplete}
          loading={loading}
        >
          Create academy & go to Dashboard
        </Button>
      </View>
    </View>
  );
}
