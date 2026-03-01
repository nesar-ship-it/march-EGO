import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { X, ArrowLeft } from 'lucide-react-native';
import { Button, Input, Switch, ProgressBar } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthStore } from '@/stores/auth-store';

export default function FoundersScreen() {
  const { cofounderEmails, setCofounderEmails } = useOnboardingStore();
  const [hasCofounders, setHasCofounders] = useState(
    cofounderEmails.length > 0 && cofounderEmails[0] !== ''
  );
  const currentUserEmail = useAuthStore(s => s.user?.email);

  const [errors, setErrors] = useState<Record<number, string>>({});

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleContinue = () => {
    let isValid = true;
    const newErrors: Record<number, string> = {};

    if (hasCofounders) {
      cofounderEmails.forEach((email, i) => {
        if (!email.trim()) return; // ignore empty rows
        
        if (!validateEmail(email.trim())) {
          newErrors[i] = 'Invalid email format';
          isValid = false;
        } else if (currentUserEmail && email.trim().toLowerCase() === currentUserEmail.toLowerCase()) {
          newErrors[i] = "This is your email — you're already an admin.";
          isValid = false;
        }
      });
      setErrors(newErrors);
    }

    if (isValid) {
      // Clear empty emails before continuing if toggled off
      if (!hasCofounders) {
        setCofounderEmails(['']);
      }
      router.push('/(auth)/onboarding/branches');
    }
  };

  const updateEmail = (text: string, index: number) => {
    const newEmails = [...cofounderEmails];
    newEmails[index] = text;
    setCofounderEmails(newEmails);
    if (errors[index]) {
      setErrors({ ...errors, [index]: '' });
    }
  };

  const removeEmail = (index: number) => {
    const newEmails = cofounderEmails.filter((_, i) => i !== index);
    if (newEmails.length === 0) newEmails.push('');
    setCofounderEmails(newEmails);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="px-6 py-4 pt-12 flex-row items-center border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar value={40} />
          <Text className="font-inter-regular text-caption text-text-tertiary text-center mt-2">Step 2 of 5</Text>
        </View>
        <View className="w-10" /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-semibold text-h2 text-text-primary mb-2">
          Do you have co-founders?
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary mb-8">
          Co-founders get full admin access to your academy, identical to yours.
        </Text>

        <View className="flex-row items-center justify-between p-4 border border-border-default rounded-lg mb-8">
          <Text className="font-inter-medium text-body-md text-text-primary">
            Yes, I have co-founders
          </Text>
          <Switch checked={hasCofounders} onCheckedChange={setHasCofounders} />
        </View>

        {hasCofounders && (
          <View className="mb-8 gap-4">
            {cofounderEmails.map((email, i) => (
              <View key={i} className="flex-row items-start gap-2">
                <View className="flex-1">
                  <Input
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={(text) => updateEmail(text, i)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={errors[i]}
                  />
                </View>
                <TouchableOpacity onPress={() => removeEmail(i)} className="p-3 mt-1 bg-bg-secondary rounded-md">
                  <X size={20} color="#737373" />
                </TouchableOpacity>
              </View>
            ))}
            <Button
              variant="ghost"
              onPress={() => setCofounderEmails([...cofounderEmails, ''])}
              className="self-start"
            >
              + Add another co-founder
            </Button>
            
            {cofounderEmails.every(e => !e.trim()) && (
              <Text className="font-inter-regular text-caption text-text-tertiary mt-2">
                You can always invite co-founders later from Settings.
              </Text>
            )}
          </View>
        )}

        <Button variant="primary" size="lg" fullWidth onPress={handleContinue}>
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
