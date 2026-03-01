import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Calendar as CalendarIcon, Filter } from 'lucide-react-native';
import { Button, Card, Badge, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

export default function AttendanceHistoryScreen() {
  const orgId = useAuthStore(s => s.user?.orgId);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);

  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('7days'); // 7days, 30days, all

  useEffect(() => {
    if (orgId) {
      loadFilters();
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      loadHistory();
    }
  }, [orgId, selectedBatchId, selectedDateFilter]);

  const loadFilters = async () => {
    const { data } = await supabase.from('batches').select('id, name').eq('org_id', orgId);
    setBatches(data || []);
  };

  const loadHistory = async () => {
    setLoading(true);

    let query = supabase
      .from('attendance_records')
      .select('*, students(first_name, last_name, enrollment_status), batches(name)')
      .order('date', { ascending: false });

    if (selectedBatchId !== 'all') {
      query = query.eq('batch_id', selectedBatchId);
    }

    if (selectedDateFilter !== 'all') {
      const days = selectedDateFilter === '7days' ? 7 : 30;
      const dateOffset = new Date();
      dateOffset.setDate(dateOffset.getDate() - days);
      query = query.gte('date', dateOffset.toISOString().slice(0, 10));
    }

    const { data } = await query;
    
    // Group by Date + Batch for better display
    // e.g., "2024-03-01 - Morning Batch" -> { present: [], absent: [] }
    // We'll flatten them back or render custom sections. Let's do simple flat list of individual records for now,
    // or grouped if it looks better. Since the PRD said table with filters, standard FlatList is fine.
    
    setRecords(data || []);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="flex-row items-center border-b border-border-default bg-white px-4 pb-4 pt-12 z-20">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text className="font-inter-semibold text-h2 text-text-primary flex-1">
          History
        </Text>
      </View>

      <View className="bg-white px-4 py-3 border-b border-border-subtle flex-row gap-3 z-10 relative">
        <View className="flex-1">
          <Select
            value={selectedDateFilter}
            onValueChange={setSelectedDateFilter}
            options={[
              { label: 'Last 7 days', value: '7days' },
              { label: 'Last 30 days', value: '30days' },
              { label: 'All time', value: 'all' },
            ]}
          />
        </View>
        <View className="flex-1">
          <Select
            value={selectedBatchId}
            onValueChange={setSelectedBatchId}
            options={[
              { label: 'All Batches', value: 'all' },
              ...batches.map(b => ({ label: b.name, value: b.id }))
            ]}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A0A0A" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Card className="p-4 bg-white flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text className="font-inter-semibold text-body-md text-text-primary">
                  {item.students?.first_name} {item.students?.last_name}
                </Text>
                <View className="flex-row items-center mt-1 gap-2">
                  <CalendarIcon size={14} color="#737373" />
                  <Text className="font-inter-regular text-caption text-text-secondary">
                    {item.date} • {item.batches?.name}
                  </Text>
                </View>
              </View>
              <Badge variant={item.status === 'present' ? 'success' : 'error'}>
                {item.status === 'present' ? 'Present' : 'Absent'}
              </Badge>
            </Card>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Text className="font-inter-regular text-body-md text-text-secondary text-center">
                No attendance records found for these filters.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
