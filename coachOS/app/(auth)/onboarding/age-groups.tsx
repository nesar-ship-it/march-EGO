import React, { useEffect } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, GripVertical } from 'lucide-react-native';
import { Button, Input, Card, ProgressBar } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { DEFAULT_AGE_GROUPS } from '@/lib/constants';

export default function AgeGroupsScreen() {
  const { ageGroups, setAgeGroups, orgDetails } = useOnboardingStore();

  useEffect(() => {
    if (ageGroups.length === 0) {
      const mapped = DEFAULT_AGE_GROUPS.map((g: any) => ({
        id: Math.random().toString(),
        name: g.name,
        min_age: g.min_age,
        max_age: g.max_age,
        gender: g.gender || 'All',
      }));
      setAgeGroups(mapped);
    }
  }, []);

  const handleContinue = () => {
    if (ageGroups.length > 0 && ageGroups.every(g => g.name.trim() !== '' && g.min_age < g.max_age)) {
      router.push('/(auth)/onboarding/complete');
    }
  };

  const updateGroup = (index: number, field: string, value: any) => {
    const newGroups = [...ageGroups];
    newGroups[index] = { ...newGroups[index]!, [field]: value };
    setAgeGroups(newGroups);
  };

  const addGroup = () => {
    setAgeGroups([...ageGroups, { id: Math.random().toString(), name: '', min_age: 0, max_age: 18, gender: 'All' }]);
  };

  const removeGroup = (index: number) => {
    if (ageGroups.length <= 1) return;
    setAgeGroups(ageGroups.filter((_, i) => i !== index));
  };

  const isValid = ageGroups.length > 0 && ageGroups.every(g => g.name.trim() !== '' && g.min_age < g.max_age);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="px-6 py-4 pt-12 flex-row items-center border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar value={100} />
          <Text className="font-inter-regular text-caption text-text-tertiary text-center mt-2">Step 5 of 5</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-semibold text-h2 text-text-primary mb-2">
          Define your age groups
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary mb-8">
          Students will be assigned automatically based on their Date of Birth.
        </Text>

        <View className="gap-4 mb-8">
          {ageGroups.map((group, i) => (
            <Card key={group.id} className="p-4 bg-bg-secondary flex-row items-start gap-4">
              <View className="pt-3">
                <GripVertical size={20} color="#A3A3A3" />
              </View>
              
              <View className="flex-1 gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      placeholder="e.g. U14"
                      value={group.name}
                      onChangeText={(text) => updateGroup(i, 'name', text)}
                    />
                  </View>
                  {ageGroups.length > 1 && (
                    <TouchableOpacity onPress={() => removeGroup(i)} className="p-3 bg-white rounded-md border border-border-default">
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      placeholder="Min Age"
                      keyboardType="numeric"
                      value={group.min_age.toString()}
                      onChangeText={(t) => updateGroup(i, 'min_age', parseInt(t) || 0)}
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      placeholder="Max Age"
                      keyboardType="numeric"
                      value={group.max_age.toString()}
                      onChangeText={(t) => updateGroup(i, 'max_age', parseInt(t) || 0)}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Button
          variant="secondary"
          onPress={addGroup}
          className="mb-12 border-dashed"
        >
          + Add age group
        </Button>

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          disabled={!isValid} 
          onPress={handleContinue}
        >
          Complete Setup
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
