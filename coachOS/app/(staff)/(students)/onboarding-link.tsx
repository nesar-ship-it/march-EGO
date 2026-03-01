import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/components/ui';
import { QRCodeCard } from '@/components/students';
import { createParentOnboardingUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function OnboardingLinkScreen() {
  const { user } = useAuth();
  const { studentId, studentIdCode, username, tempPassword, parentToken, studentName, parentOnboardingUrl } = useLocalSearchParams<{
    studentId?: string;
    studentIdCode?: string;
    username?: string;
    tempPassword?: string;
    parentToken?: string;
    studentName?: string;
    parentOnboardingUrl?: string;
  }>();

  const [academyName, setAcademyName] = useState<string>('Academy');
  const url = (parentOnboardingUrl && parentOnboardingUrl.length > 0) ? parentOnboardingUrl : (parentToken ? createParentOnboardingUrl(parentToken) : '');
  const credentials = username && tempPassword
    ? `Username: ${username} | Password: ${tempPassword}`
    : '';

  useEffect(() => {
    if (!user?.orgId) return;
    supabase.from('organizations').select('name').eq('id', user.orgId).single().then(({ data }) => {
      if (data?.name) setAcademyName(data.name);
    });
  }, [user?.orgId]);

  const handleCopyCredentials = () => {
    if (credentials) Clipboard.setStringAsync(credentials);
  };

  const handleCopyLink = () => {
    if (url) Clipboard.setStringAsync(url);
  };

  const handleShareWhatsApp = () => {
    const message = [
      `${academyName} – Student details`,
      '',
      `Student: ${studentName ?? '—'}`,
      studentIdCode ? `ID: ${studentIdCode}` : '',
      '',
      credentials,
      '',
      'Parent onboarding: ' + url,
    ].filter(Boolean).join('\n');
    Linking.openURL('whatsapp://send?text=' + encodeURIComponent(message));
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="font-inter-semibold text-h2 text-text-primary">
        Student created
      </Text>
      {studentName ? (
        <Text className="mt-1 font-inter-regular text-body-md text-text-secondary">
          {studentName}
        </Text>
      ) : null}
      {studentIdCode ? (
        <Text className="mt-0.5 font-inter-medium text-label-md text-text-secondary">
          ID: {studentIdCode}
        </Text>
      ) : null}

      <View className="mt-6 rounded-lg border border-border-default bg-bg-secondary p-4">
        <Text className="font-inter-medium text-label-md text-text-secondary">
          Student login credentials
        </Text>
        <Text className="mt-2 font-mono text-body-sm text-text-primary">
          {username ?? '—'}
        </Text>
        <Text className="mt-1 font-mono text-body-sm text-text-primary">
          {tempPassword ?? '—'}
        </Text>
        <Button variant="secondary" size="sm" className="mt-3" onPress={handleCopyCredentials}>
          Copy credentials
        </Button>
        <Text className="mt-2 font-inter-regular text-caption text-text-tertiary">
          Save these — the password cannot be retrieved later.
        </Text>
      </View>

      <View className="mt-6">
        <Text className="font-inter-medium text-label-md text-text-secondary">
          Share with parent
        </Text>
        <Text className="mt-1 font-inter-regular text-caption text-text-tertiary">
          Send this link to complete the student's profile.
        </Text>
        <QRCodeCard value={url} size={200} className="mt-3" />
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button variant="secondary" size="sm" onPress={handleCopyLink}>
            Copy link
          </Button>
          <Button variant="secondary" size="sm" onPress={handleShareWhatsApp}>
            Share via WhatsApp
          </Button>
        </View>
      </View>

      <Button variant="primary" size="lg" className="mt-8" onPress={() => router.replace('/(staff)/(students)/')}>
        Done
      </Button>
    </ScrollView>
  );
}
