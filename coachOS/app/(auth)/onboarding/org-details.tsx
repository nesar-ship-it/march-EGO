import React from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, Card, Checkbox, ProgressBar, Select } from '@/components/ui';
import { useOnboardingStore, SportType } from '@/stores/onboarding-store';

const SPORTS: SportType[] = ['Cricket', 'Football', 'Hockey', 'Tennis', 'Badminton', 'Basketball', 'Swimming', 'Athletics', 'Other'];

export default function OrgDetailsScreen() {
  const { orgDetails, setOrgDetails } = useOnboardingStore();
  const { sport_type, sport_type_other, name } = orgDetails;

  const isValid = sport_type && name.trim().length >= 2 && name.trim().length <= 100;

  const handleContinue = () => {
    if (isValid) {
      router.push('/(auth)/onboarding/founders');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <View className="px-6 py-4 pt-12">
        <ProgressBar value={20} className="mb-2" />
        <Text className="font-inter-regular text-caption text-text-tertiary text-center">Step 1 of 5</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-semibold text-h2 text-text-primary mb-8">
          What sport does your academy focus on?
        </Text>

        <View className="flex-row flex-wrap gap-3 mb-8">
          {SPORTS.map((sport) => (
            <Button
              key={sport}
              variant={sport_type === sport ? 'primary' : 'secondary'}
              className="mr-2 mb-2"
              onPress={() => {
                setOrgDetails({ sport_type: sport });
                if (sport !== 'Other') {
                  setOrgDetails({ sport_type_other: '' });
                }
              }}
            >
              {sport}
            </Button>
          ))}
        </View>

        {sport_type === 'Other' && (
          <View className="mb-8">
            <Input
              label="Sport name"
              placeholder="E.g., Chess, Gymnastics"
              value={sport_type_other}
              onChangeText={(text) => setOrgDetails({ sport_type_other: text })}
            />
          </View>
        )}

        <View className="mb-12">
          <Input
            label="Academy Name"
            placeholder="Enter academy name"
            value={name}
            onChangeText={(text) => setOrgDetails({ name: text })}
            maxLength={100}
          />
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isValid}
          onPress={handleContinue}
        >
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
