import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, Card, Toast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateInviteToken, acceptInvite } from '@/services/invites';
import { useAuthStore } from '@/stores/auth-store';

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link.');
      setLoading(false);
      return;
    }

    validateInviteToken(token).then(({ valid, invite }) => {
      if (!valid || !invite) {
        setError('This invite link is invalid or has expired. Please ask your admin for a new link.');
      } else {
        setInviteData(invite);
      }
      setLoading(false);
    }).catch(() => {
      setError('Something went wrong checking this invite.');
      setLoading(false);
    });
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    // Prompt for Google login if not logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + `/invite/${token}`
        }
      });
      if (signInError) {
        setError('Sign in failed. Please try again.');
        setIsAccepting(false);
      }
      return; // The OAuth redirect will reload the page
    }

    // Already signed in via Google (or returned from OAuth redirect)
    const authUser = session.user;
    const { error: acceptErr } = await acceptInvite(
      token!,
      authUser.id,
      authUser.email || '',
      authUser.user_metadata?.full_name || 'Staff Member'
    );

    setIsAccepting(false);

    if (acceptErr) {
      // Check if they already exist in this org
      if (acceptErr.includes('duplicate key') || acceptErr.includes('already have an account')) {
        router.replace('/(staff)/(home)');
      } else {
        setError(acceptErr);
      }
    } else {
      router.replace('/(staff)/(home)');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <ActivityIndicator size="large" color="#0A0A0A" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary px-6">
        <Text className="font-inter-semibold text-h3 text-text-primary text-center mb-4">
          Cannot Accept Invite
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary text-center mb-8">
          {error}
        </Text>
        <Button variant="secondary" onPress={() => router.replace('/(auth)/login')}>
          Go to Login
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center px-6">
      <Card className="w-full max-w-[400px] p-6 items-center">
        <Text className="font-inter-semibold text-h2 text-text-primary mb-2 text-center">
          You've been invited!
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary text-center mb-8">
          You've been invited to join {inviteData?.org_name}.
        </Text>

        <View className="w-full bg-bg-secondary p-4 rounded-lg mb-8 border border-border-default">
          <View className="flex-row justify-between mb-2">
            <Text className="font-inter-medium text-caption text-text-secondary">Role</Text>
            <Text className="font-inter-semibold text-body-sm text-text-primary">
              {inviteData?.role?.replace(/_/g, ' ')}
            </Text>
          </View>
          {inviteData?.branch_name && (
            <View className="flex-row justify-between">
              <Text className="font-inter-medium text-caption text-text-secondary">Branch</Text>
              <Text className="font-inter-semibold text-body-sm text-text-primary">
                {inviteData.branch_name}
              </Text>
            </View>
          )}
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleAccept}
          loading={isAccepting}
        >
          Continue with Google
        </Button>
        <Text className="font-inter-regular text-caption text-text-tertiary text-center mt-4">
          You'll sign in with your Google account to accept this invitation.
        </Text>
      </Card>
    </View>
  );
}
