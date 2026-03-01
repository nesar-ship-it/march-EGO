import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Avatar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Search, UserPlus, FileText } from 'lucide-react-native';

export default function StudentsIndexScreen() {
  const orgId = useAuthStore((s: any) => s.user?.orgId);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (orgId) {
      loadStudents();
    }
  }, [orgId]);

  const loadStudents = async () => {
    setLoading(true);
    // Fetch all active students for this org
    const { data } = await supabase
      .from('students')
      .select('*, batches(name)')
      .eq('org_id', orgId!)
      .eq('enrollment_status', 'active')
      .order('first_name', { ascending: true });

    setStudents(data || []);
    setLoading(false);
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="border-b border-border-default bg-white px-6 pb-4 pt-12">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-inter-semibold text-h2 text-text-primary">
            Students
          </Text>
          <Button variant="primary" size="sm" icon={UserPlus} onPress={() => router.push('/(staff)/(students)/add')}>
            Add Student
          </Button>
        </View>

        <View className="flex-row items-center bg-bg-tertiary rounded-lg px-3 py-2 border border-border-default">
          <Search size={18} color="#737373" className="mr-2" />
          <TextInput
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 font-inter-regular text-body-md text-text-primary h-8"
            placeholderTextColor="#999999"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A0A0A" />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const fullName = `${item.first_name} ${item.last_name || ''}`;
            
            return (
              <TouchableOpacity onPress={() => router.push(`/(staff)/(students)/${item.id}`)} activeOpacity={0.7}>
                <Card className="flex-row items-center p-4">
                  <Avatar name={fullName} size="md" className="mr-4" />
                  <View className="flex-1">
                    <Text className="font-inter-semibold text-body-md text-text-primary">
                      {fullName}
                    </Text>
                    {item.batches?.name && (
                      <Text className="font-inter-regular text-caption text-text-secondary mt-0.5">
                        {item.batches.name}
                      </Text>
                    )}
                  </View>
                  <FileText size={20} color="#0A0A0A" opacity={0.3} />
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Text className="font-inter-regular text-body-md text-text-secondary text-center">
                {searchQuery ? "No students match your search." : "No students added yet. Click 'Add Student' to get started."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
