import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { getAuditLogs } from '@/services/audit-log';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';

const ACTION_LABELS: Record<string, string> = {
  'org.create': 'Academy created',
  'staff.invite_accepted': 'Invite accepted',
  'student.create': 'Student added',
  'student.parent_onboarding_complete': 'Parent onboarding completed',
  'attendance.mark': 'Attendance marked',
  'payment.created': 'Payment created',
  'payment.paid': 'Payment received',
  'student.password_reset': 'Student password reset',
};

export default function AuditLogsScreen() {
  const { user } = useAuth();
  const orgId = user?.orgId;
  const isSuperAdmin = user?.role === 'super_admin';

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await getAuditLogs(orgId, {}, 50);
      return data;
    },
    enabled: !!orgId && isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ padding: 16 }}>
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          ← Back
        </Button>
        <Text className="mt-4 font-inter-semibold text-h2 text-text-primary">
          Audit logs
        </Text>
        <Card className="mt-4">
          <Text className="font-inter-regular text-body-md text-text-secondary">
            Only super admins can view audit logs.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="bg-white px-4 pb-4 pt-12">
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          ← Back
        </Button>
        <Text className="mt-4 font-inter-semibold text-h2 text-text-primary">
          Audit logs
        </Text>
        <Text className="mt-1 font-inter-regular text-body-md text-text-secondary">
          Recent activity in your academy
        </Text>
      </View>
      <View className="px-4 pt-4">
        {isLoading ? (
          <Text className="font-inter-regular text-body-md text-text-tertiary">Loading...</Text>
        ) : logs.length === 0 ? (
          <Card>
            <Text className="font-inter-regular text-body-md text-text-secondary">
              No audit logs yet
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {logs.map((log: { id: string; action: string; entity_type: string; entity_id?: string | null; created_at: string; actor_role?: string | null }) => (
              <Card key={log.id} padding="md">
                <Text className="font-inter-medium text-body-md text-text-primary">
                  {ACTION_LABELS[log.action] ?? log.action}
                </Text>
                <Text className="mt-1 font-inter-regular text-caption text-text-tertiary">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ''}
                  {log.actor_role ? ` · ${log.actor_role}` : ''}
                </Text>
                <Text className="mt-1 font-inter-regular text-caption text-text-tertiary">
                  {formatDate(log.created_at)}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
