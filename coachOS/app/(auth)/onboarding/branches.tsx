import React from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { Button, Input, Card, ProgressBar } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function BranchesScreen() {
  const { branches, setBranches } = useOnboardingStore();

  const handleContinue = () => {
    // Basic validation: at least one branch with a name
    if (branches.length > 0 && branches[0]?.name.trim() !== '') {
      router.push('/(auth)/onboarding/batches');
    }
  };

  const updateBranch = (index: number, field: string, value: string) => {
    const newBranches = [...branches];
    newBranches[index] = { ...newBranches[index]!, [field]: value };
    setBranches(newBranches);
  };

  const addBranch = () => {
    setBranches([...branches, { id: Math.random().toString(), name: '', address: '', city: '', phone: '' }]);
  };

  const removeBranch = (index: number) => {
    if (branches.length <= 1) return;
    setBranches(branches.filter((_, i) => i !== index));
  };

  const isValid = branches.length > 0 && branches.every(b => b.name.trim() !== '');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="px-6 py-4 pt-12 flex-row items-center border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar value={60} />
          <Text className="font-inter-regular text-caption text-text-tertiary text-center mt-2">Step 3 of 5</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-semibold text-h2 text-text-primary mb-2">
          Set up your branches
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary mb-8">
          Add each physical location where you run training sessions.
        </Text>

        <View className="gap-6 mb-8">
          {branches.map((branch, i) => (
            <Card key={branch.id} className="p-4 bg-bg-secondary relative">
              {branches.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeBranch(i)}
                  className="absolute top-4 right-4 p-2 z-10"
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              
              <Text className="font-inter-semibold text-body-md text-text-primary mb-4">
                Branch {i + 1}
              </Text>
              
              <View className="gap-4">
                <Input
                  label="Branch name *"
                  placeholder="e.g., Shivaji Park Branch"
                  value={branch.name}
                  onChangeText={(text) => updateBranch(i, 'name', text)}
                />
                
                <Input
                  label="Address (optional)"
                  placeholder="Street address"
                  value={branch.address}
                  onChangeText={(text) => updateBranch(i, 'address', text)}
                />
                
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Input
                      label="City (optional)"
                      placeholder="City"
                      value={branch.city}
                      onChangeText={(text) => updateBranch(i, 'city', text)}
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Phone (optional)"
                      placeholder="+91"
                      keyboardType="phone-pad"
                      value={branch.phone}
                      onChangeText={(text) => updateBranch(i, 'phone', text)}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Button
          variant="secondary"
          onPress={addBranch}
          className="mb-12 border-dashed"
        >
          + Add another branch
        </Button>

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
