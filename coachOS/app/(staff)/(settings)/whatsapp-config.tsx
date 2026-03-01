import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, Input, Card, Toast } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

export default function WhatsAppConfigScreen() {
  const { user } = useAuthStore();
  const orgId = user?.orgId;

  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [waAccountId, setWaAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (orgId) {
      loadConfig();
    }
  }, [orgId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('whatsapp_config')
        .eq('id', orgId!)
        .single();

      if (data && data.whatsapp_config) {
        const config = data.whatsapp_config as any;
        setPhoneNumberId(config.phone_number_id || '');
        setWaAccountId(config.business_account_id || '');
        setAccessToken(config.access_token || '');
      }
    } catch (e: any) {
      console.error('Failed to load WhatsApp config', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          whatsapp_config: {
            phone_number_id: phoneNumberId,
            business_account_id: waAccountId,
            access_token: accessToken,
          },
        })
        .eq('id', orgId!);

      if (error) throw error;
      showToast('WhatsApp configuration saved', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-secondary p-6 items-center justify-center">
        <Text className="text-text-secondary">Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bg-secondary">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-semibold text-h2 text-text-primary mb-2">
          WhatsApp Configuration
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary mb-8">
          Configure your Meta Developer credentials to enable automated WhatsApp messages and broadcasts.
        </Text>

        <Card className="p-6 mb-6">
          <Text className="font-inter-medium text-label-md text-text-secondary mb-4">
            API Credentials
          </Text>
          
          <View className="gap-4">
            <Input 
              label="Phone Number ID" 
              placeholder="e.g. 12937401923..."
              value={phoneNumberId}
              onChangeText={setPhoneNumberId}
            />
            
            <Input 
              label="WhatsApp Business Account ID" 
              placeholder="e.g. 39485710294..."
              value={waAccountId}
              onChangeText={setWaAccountId}
            />
            
            <View>
              <Text className="font-inter-medium text-caption text-text-secondary mb-1">Permanent Access Token</Text>
              <Input 
                placeholder="EAAI..."
                value={accessToken}
                onChangeText={setAccessToken}
                secureTextEntry
              />
              <Text className="font-inter-regular text-caption text-text-tertiary mt-1">
                Found in Meta Developer Dashboard &gt; WhatsApp &gt; API Setup
              </Text>
            </View>
          </View>
        </Card>

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          loading={isSaving}
          onPress={handleSave}
        >
          Save Configuration
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
