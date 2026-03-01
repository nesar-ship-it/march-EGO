import React from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { Button, Input, Card, ProgressBar } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboarding-store';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BatchesScreen() {
  const { batches, setBatches, branches } = useOnboardingStore();

  const handleContinue = () => {
    if (batches.length > 0 && batches.every(b => b.name.trim() !== '' && b.days_of_week.length > 0)) {
      router.push('/(auth)/onboarding/age-groups');
    }
  };

  const updateBatch = (index: number, field: string, value: any) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index]!, [field]: value };
    setBatches(newBatches);
  };

  const toggleDay = (index: number, day: string) => {
    const batch = batches[index]!;
    const newDays = batch.days_of_week.includes(day)
      ? batch.days_of_week.filter(d => d !== day)
      : [...batch.days_of_week, day];
    updateBatch(index, 'days_of_week', newDays);
  };

  const addBatch = () => {
    setBatches([...batches, {
      id: Math.random().toString(),
      name: '',
      start_time: '09:00',
      end_time: '11:00',
      days_of_week: [],
      apply_to: 'all',
      selected_branches: [],
    }]);
  };

  const removeBatch = (index: number) => {
    if (batches.length <= 1) return;
    setBatches(batches.filter((_, i) => i !== index));
  };

  const isValid = batches.length > 0 && batches.every(b => b.name.trim() !== '' && b.days_of_week.length > 0);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="px-6 py-4 pt-12 flex-row items-center border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar value={80} />
          <Text className="font-inter-regular text-caption text-text-tertiary text-center mt-2">Step 4 of 5</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-semibold text-h2 text-text-primary mb-2">
          Set up your training batches
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary mb-8">
          Batches are your recurring training time slots. Students are assigned to a batch when they join.
        </Text>

        <View className="gap-6 mb-8">
          {batches.map((batch, i) => (
            <Card key={batch.id} className="p-4 bg-bg-secondary relative">
              {batches.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeBatch(i)}
                  className="absolute top-4 right-4 p-2 z-10"
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              
              <View className="gap-4">
                <Input
                  label="Batch name *"
                  placeholder="e.g., Morning Batch"
                  value={batch.name}
                  onChangeText={(text) => updateBatch(i, 'name', text)}
                />
                
                {/* Time picker (simplified for cross-platform) */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Input
                      label="Start Time (HH:MM)"
                      placeholder="06:00"
                      value={batch.start_time || ''}
                      onChangeText={(text) => updateBatch(i, 'start_time', text)}
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="End Time (HH:MM)"
                      placeholder="08:00"
                      value={batch.end_time || ''}
                      onChangeText={(text) => updateBatch(i, 'end_time', text)}
                    />
                  </View>
                </View>

                {/* Days of Week */}
                <View>
                  <Text className="font-inter-medium text-caption text-text-secondary mb-2">Days *</Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {DAYS.map(day => {
                      const isActive = batch.days_of_week.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleDay(i, day)}
                          className={`w-10 h-10 items-center justify-center rounded-full border ${
                            isActive 
                              ? 'bg-bg-inverse border-bg-inverse' 
                              : 'bg-white border-border-default'
                          }`}
                        >
                          <Text className={`font-inter-medium text-caption ${
                            isActive ? 'text-text-inverse' : 'text-text-secondary'
                          }`}>
                            {day.charAt(0)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Button
          variant="secondary"
          onPress={addBatch}
          className="mb-12 border-dashed"
        >
          + Add another batch
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
