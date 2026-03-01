import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Users, Clock, History } from 'lucide-react-native';

export default function AttendanceIndexScreen() {
  const orgId = useAuthStore(s => s.user?.orgId);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      loadBatches();
    }
  }, [orgId]);

  const loadBatches = async () => {
    setLoading(true);
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    // Fetch batches primarily focused on today
    // To simplify for now, fetch all batches for this org and highlight today's
    const { data } = await supabase
      .from('batches')
      .select('*, branches(name)')
      .eq('org_id', orgId);

    setBatches(data || []);
    setLoading(false);
  };

  const handleSelectBatch = (batchId: string, batchName: string) => {
    router.push(`/(staff)/(attendance)/take?batchId=${batchId}&batchName=${encodeURIComponent(batchName)}`);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary">
        <ActivityIndicator size="large" color="#0A0A0A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="flex-row items-center border-b border-border-default bg-white px-6 pb-4 pt-12">
        <View className="flex-1">
          <Text className="font-inter-semibold text-h2 text-text-primary">
            Attendance
          </Text>
          <Text className="mt-1 font-inter-regular text-body-md text-text-secondary">
            Select a batch to take attendance
          </Text>
        </View>
        <Button variant="secondary" size="sm" icon={History} onPress={() => router.push('/(staff)/(attendance)/history')}>
          History
        </Button>
      </View>

      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const isToday = item.days_of_week?.includes(todayStr);

          return (
            <TouchableOpacity onPress={() => handleSelectBatch(item.id, item.name)} activeOpacity={0.7}>
              <Card className="p-4 bg-white relative">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="font-inter-semibold text-body-lg text-text-primary mb-1">
                      {item.name}
                    </Text>
                    {item.branches?.name && (
                      <Text className="font-inter-regular text-caption text-text-tertiary">
                        {item.branches.name}
                      </Text>
                    )}
                  </View>
                  {isToday && (
                    <Badge variant="info">Today</Badge>
                  )}
                </View>

                <View className="flex-row gap-4 mt-2">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={16} color="#737373" />
                    <Text className="font-inter-medium text-caption text-text-secondary">
                      {item.start_time ? item.start_time.slice(0, 5) : '--:--'} - {item.end_time ? item.end_time.slice(0, 5) : '--:--'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Users size={16} color="#737373" />
                    <Text className="font-inter-medium text-caption text-text-secondary">
                      Start session
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-1 mt-4">
                  {item.days_of_week?.map((day: string) => (
                    <View key={day} className={`px-2 py-0.5 rounded border ${
                      day === todayStr ? 'bg-bg-inverse border-bg-inverse' : 'bg-bg-tertiary border-border-default'
                    }`}>
                      <Text className={`font-inter-medium text-[10px] ${
                        day === todayStr ? 'text-white' : 'text-text-tertiary'
                      }`}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="font-inter-regular text-body-md text-text-secondary text-center">
              No batches found. Create batches in Settings first.
            </Text>
          </View>
        }
      />
    </View>
  );
}
