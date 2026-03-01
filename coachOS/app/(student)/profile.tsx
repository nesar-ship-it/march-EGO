import { View, Text, ScrollView } from 'react-native';
import { Card, Avatar, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { getStudentById } from '@/services/students';
import { useQuery } from '@tanstack/react-query';

export default function StudentProfileScreen() {
  const { user, signOut } = useAuth();
  const studentId = (user?.profile as { id?: string })?.id;
  const orgId = user?.orgId;

  const { data: student } = useQuery({
    queryKey: ['student', 'profile', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return null;
      const { student: s } = await getStudentById({ student_id: studentId, org_id: orgId });
      return s;
    },
    enabled: !!orgId && !!studentId,
  });

  const fullName = student
    ? `${student.first_name ?? ''}${student.last_name ? ` ${student.last_name}` : ''}`
    : '';
  const batch = student?.batch as { name?: string } | null | undefined;
  const ageGroup = student?.age_group as { name?: string } | null | undefined;

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Profile
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          Your academy profile
        </Text>
      </View>
      <View className="px-4 pt-4">
        <Card className="mb-3">
          <View className="flex-row items-center gap-4">
            <Avatar name={fullName} size="lg" imageUrl={null} />
            <View className="flex-1">
              <Text className="font-inter-semibold text-h2 text-text-primary">
                {fullName}
              </Text>
              <Text className="font-mono text-caption text-text-tertiary">
                ID: {student?.student_id_code ?? '—'}
              </Text>
            </View>
          </View>
        </Card>
        <Card className="mb-3">
          <Text className="font-inter-medium text-label-md text-text-secondary">
            Batch
          </Text>
          <Text className="mt-1 font-inter-regular text-body-md text-text-primary">
            {batch?.name ?? '—'}
          </Text>
        </Card>
        <Card className="mb-3">
          <Text className="font-inter-medium text-label-md text-text-secondary">
            Age group
          </Text>
          <Text className="mt-1 font-inter-regular text-body-md text-text-primary">
            {ageGroup?.name ?? '—'}
          </Text>
        </Card>
        <Card className="mb-3">
          <Text className="font-inter-medium text-label-md text-text-secondary">
            School
          </Text>
          <Text className="mt-1 font-inter-regular text-body-md text-text-primary">
            {student?.school_name ?? '—'} {student?.school_grade ? `(${student.school_grade})` : ''}
          </Text>
        </Card>
        <View className="rounded-lg border border-border-default bg-bg-secondary p-3">
          <Text className="font-inter-regular text-caption text-text-tertiary">
            To update your profile or for any questions, please contact your academy admin.
          </Text>
        </View>
        <Button variant="secondary" size="lg" className="mt-6" onPress={() => signOut()}>
          Sign out
        </Button>
      </View>
    </ScrollView>
  );
}
