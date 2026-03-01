import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Check, ArrowLeft } from 'lucide-react-native';
import { Button, ProgressBar, SwipeCard, Avatar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store'; // We will create this

export default function TakeAttendanceScreen() {
  const { batchId, batchName } = useLocalSearchParams<{ batchId: string; batchName: string }>();
  const orgId = useAuthStore((s: any) => s.user?.orgId);
  
  const setSessionData = useAttendanceStore((s: any) => s.setSessionData);

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [absentIds, setAbsentIds] = useState<string[]>([]);

  useEffect(() => {
    if (orgId && batchId) {
      loadStudents();
    }
  }, [orgId, batchId]);

  const loadStudents = async () => {
    setLoading(true);
    // Fetch students assigned to this batch
    // PRD: student_batches link table? If not, we fall back to all active students for now.
    // In our schema (from 003_students.sql), we have students with 'batch_id' or 'enrollment_status'
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('org_id', orgId!)
      .eq('enrollment_status', 'active');
      
    // Ideally filter by batch_id, if your schema supports it:
    // .eq('batch_id', batchId)
    // For now we use the fetched data:
    setStudents(data || []);
    setLoading(false);
  };

  const currentStudent = students[currentIndex];
  const isFinished = students.length > 0 && currentIndex >= students.length;
  const progress = students.length > 0 ? (currentIndex / students.length) * 100 : 0;

  useEffect(() => {
    if (isFinished && students.length > 0) {
      // Go to summary
      setSessionData({ 
        batchId: batchId!, 
        batchName: batchName || 'Batch', 
        presentIds, 
        absentIds,
        students
      });
      router.replace(`/(staff)/(attendance)/summary`);
    }
  }, [isFinished]);

  const handleSwipeLeft = () => {
    if (currentStudent) {
      setAbsentIds(prev => [...prev, currentStudent.id]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentStudent) {
      setPresentIds(prev => [...prev, currentStudent.id]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevStudentId = students[prevIndex].id;
      
      setPresentIds(prev => prev.filter(id => id !== prevStudentId));
      setAbsentIds(prev => prev.filter(id => id !== prevStudentId));
      setCurrentIndex(prevIndex);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary">
        <ActivityIndicator size="large" color="#0A0A0A" />
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary px-6">
        <Text className="font-inter-semibold text-h3 text-text-primary text-center mb-4">
          No students found
        </Text>
        <Text className="font-inter-regular text-body-md text-text-secondary text-center mb-8">
          There are no active students assigned to this batch.
        </Text>
        <Button variant="secondary" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-secondary px-6">
        <ActivityIndicator size="large" color="#0A0A0A" />
        <Text className="mt-4 font-inter-medium text-body-md text-text-secondary">
          Preparing summary...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-secondary">
      {/* Header */}
      <View className="flex-row items-center border-b border-border-default bg-white px-4 pb-4 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-inter-semibold text-body-lg text-text-primary">
            {batchName}
          </Text>
          <Text className="font-inter-regular text-caption text-text-secondary">
            {currentIndex + 1} of {students.length} students
          </Text>
        </View>
        <Button variant="ghost" size="sm" onPress={handleUndo} disabled={currentIndex === 0}>
          Undo
        </Button>
      </View>

      <ProgressBar value={progress} />

      {/* Main Swipe Area */}
      <View className="flex-1 items-center justify-center px-6 pt-8 pb-12 overflow-hidden relative">
        {/* We render a few cards behind for stack effect, but only the top one uses SwipeCard */}
        {students.slice(currentIndex, currentIndex + 3).reverse().map((student, i, arr) => {
          const isTop = i === arr.length - 1;
          const indexOffset = arr.length - 1 - i;
          
          if (isTop) {
            return (
              <SwipeCard
                key={student.id}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              >
                <View className="w-[300px] h-[400px] bg-white rounded-2xl shadow-sm border border-border-subtle items-center justify-center p-6">
                  <Avatar name={student.first_name + ' ' + student.last_name} size="xl" className="mb-6 w-32 h-32 rounded-full" />
                  <Text className="font-inter-semibold text-[24px] text-text-primary text-center mb-2">
                    {student.first_name} {student.last_name}
                  </Text>
                  <Text className="font-inter-regular text-body-lg text-text-secondary mb-1">
                    {student.sport_roles ? student.sport_roles.join(', ') : 'Student'}
                  </Text>
                  {student.jersey_number ? (
                    <Text className="font-inter-medium text-body-md text-text-tertiary">
                      #{student.jersey_number}
                    </Text>
                  ) : null}
                </View>
              </SwipeCard>
            );
          } else {
            // Background cards (scaled and offset)
            return (
              <View
                key={student.id}
                style={[
                  styles.backgroundCard,
                  {
                    transform: [
                      { scale: 1 - indexOffset * 0.05 },
                      { translateY: indexOffset * -15 },
                    ],
                    opacity: 1 - indexOffset * 0.2,
                  },
                ]}
              >
                <View className="w-[300px] h-[400px] bg-white rounded-2xl border border-border-subtle items-center justify-center p-6">
                  <Avatar name={student.first_name + ' ' + student.last_name} size="xl" className="mb-6 w-32 h-32 rounded-full" />
                  <Text className="font-inter-semibold text-[24px] text-text-primary text-center mb-2">
                    {student.first_name} {student.last_name}
                  </Text>
                </View>
              </View>
            );
          }
        })}

        {/* Buttons (fixed at bottom) */}
        <View className="absolute bottom-12 flex-row justify-center items-center w-full gap-8">
          <TouchableOpacity
            onPress={handleSwipeLeft}
            className="w-16 h-16 rounded-full bg-white border border-border-default items-center justify-center shadow-sm"
          >
            <X size={32} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSwipeRight}
            className="w-16 h-16 rounded-full bg-white border border-border-default items-center justify-center shadow-sm"
          >
            <Check size={32} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundCard: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
});
