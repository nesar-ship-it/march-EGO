import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Toast, Checkbox } from '@/components/ui';
import { useAttendanceStore } from '@/stores/attendance-store';
import { X, Check } from 'lucide-react-native';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import type { AttendanceRecordPayload } from '@/stores/offline-store';

export default function AttendanceSummaryScreen() {
  const { session, setSessionData, clearSession } = useAttendanceStore();
  const { queueAttendance } = useOfflineSync();
  const [loading, setLoading] = useState(false);
  const [notifyAbsentees, setNotifyAbsentees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary px-6">
        <Text className="font-inter-medium text-body-md text-text-secondary">
          No active attendance session.
        </Text>
        <Button variant="secondary" className="mt-4" onPress={() => router.replace('/(staff)/(attendance)')}>
          Go back
        </Button>
      </View>
    );
  }

  const { students, presentIds, absentIds, batchId } = session;

  const handleToggleStatus = (studentId: string, currentStatus: 'present' | 'absent') => {
    if (currentStatus === 'present') {
      setSessionData({
        ...session,
        presentIds: presentIds.filter(id => id !== studentId),
        absentIds: [...absentIds, studentId]
      });
    } else {
      setSessionData({
        ...session,
        absentIds: absentIds.filter(id => id !== studentId),
        presentIds: [...presentIds, studentId]
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build the records payload
      const records: AttendanceRecordPayload[] = [
        ...presentIds.map(id => ({ student_id: id, batch_id: batchId, status: 'present' as const })),
        ...absentIds.map(id => ({ student_id: id, batch_id: batchId, status: 'absent' as const }))
      ];

      // Add to offline queue
      await queueAttendance(records);

      if (notifyAbsentees && absentIds.length > 0) {
        // Trigger hypothetical edge function for whatsapp notification
        // ...
      }

      clearSession();
      router.replace('/(staff)/(attendance)');
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  const renderStudent = (id: string, status: 'present' | 'absent') => {
    const student = students.find(s => s.id === id);
    if (!student) return null;

    return (
      <View key={id} className="flex-row items-center justify-between py-3 border-b border-border-subtle last:border-0">
        <View className="flex-1 pr-4">
          <Text className="font-inter-medium text-body-md text-text-primary">
            {student.first_name} {student.last_name}
          </Text>
          {student.jersey_number && (
            <Text className="font-inter-regular text-caption text-text-tertiary">
              #{student.jersey_number}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => handleToggleStatus(id, status)}
          className={`flex-row items-center px-3 py-1.5 rounded-full ${
            status === 'present' ? 'bg-status-success/10' : 'bg-status-error/10'
          }`}
        >
          {status === 'present' ? (
            <Check size={14} color="#10B981" className="mr-1" />
          ) : (
            <X size={14} color="#EF4444" className="mr-1" />
          )}
          <Text className={`font-inter-medium text-caption ${
            status === 'present' ? 'text-status-success' : 'text-status-error'
          }`}>
            {status === 'present' ? 'Present' : 'Absent'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Attendance Summary
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary">
          Review before submitting
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {error && (
          <View className="mb-4">
            <Toast visible={!!error} variant="error" message={error} onDismiss={() => setError(null)} />
          </View>
        )}

        <View className="flex-row gap-4 mb-6">
          <Card className="flex-1 p-4 bg-white items-center justify-center border-l-4 border-l-status-success">
            <Text className="font-inter-bold text-[32px] text-text-primary mb-1">
              {presentIds.length}
            </Text>
            <Text className="font-inter-medium text-caption text-text-secondary">Present</Text>
          </Card>
          <Card className="flex-1 p-4 bg-white items-center justify-center border-l-4 border-l-status-error">
            <Text className="font-inter-bold text-[32px] text-text-primary mb-1">
              {absentIds.length}
            </Text>
            <Text className="font-inter-medium text-caption text-text-secondary">Absent</Text>
          </Card>
        </View>

        <View className="bg-white rounded-xl border border-border-default overflow-hidden mb-6">
          {absentIds.length > 0 && (
            <View className="p-4 border-b border-border-default bg-bg-secondary">
              <Text className="font-inter-semibold text-body-md text-text-primary">
                Absent ({absentIds.length})
              </Text>
            </View>
          )}
          <View className="px-4">
            {absentIds.map(id => renderStudent(id, 'absent'))}
          </View>
        </View>

        <View className="bg-white rounded-xl border border-border-default overflow-hidden mb-6">
          {presentIds.length > 0 && (
            <View className="p-4 border-b border-border-default bg-bg-secondary">
              <Text className="font-inter-semibold text-body-md text-text-primary">
                Present ({presentIds.length})
              </Text>
            </View>
          )}
          <View className="px-4">
            {presentIds.map(id => renderStudent(id, 'present'))}
          </View>
        </View>

        {absentIds.length > 0 && (
          <View className="flex-row items-center border border-border-default p-4 rounded-lg bg-white mb-6">
            <View className="flex-1">
              <Text className="font-inter-semibold text-body-md text-text-primary">Notify Absentees</Text>
              <Text className="font-inter-regular text-caption text-text-secondary mt-1">
                Send WhatsApp alerts to parents of absent students.
              </Text>
            </View>
            <Checkbox 
              checked={notifyAbsentees}
              onCheckedChange={() => setNotifyAbsentees(!notifyAbsentees)}
            />
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View className="absolute bottom-0 w-full bg-white border-t border-border-default p-4 pb-8">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          loading={loading}
          onPress={handleSubmit}
        >
          Submit Attendance
        </Button>
      </View>
    </View>
  );
}
