import { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Card, Button, Sheet } from '@/components/ui';
import { BroadcastComposer } from '@/components/communication';
import { useAuth } from '@/hooks/useAuth';
import { getRecentWhatsAppLogs } from '@/services/whatsapp';
import { getOverduePaymentCount } from '@/services/payments';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime, formatDate } from '@/lib/utils';

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  payment_reminder: 'Payment reminder',
  payment_received: 'Payment received',
  absent_alert: 'Absent alert',
  class_cancelled: 'Class cancelled',
  welcome_student: 'Welcome student',
  match_reminder: 'Match reminder',
  custom_announcement: 'Custom announcement',
  credentials: 'Credentials',
};

export default function CommunicateScreen() {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const { user } = useAuth();
  const orgId = user?.orgId;
  const branchId = (user?.profile as { branch_id?: string })?.branch_id;

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['whatsapp_logs', orgId, branchId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await getRecentWhatsAppLogs(orgId, { branch_id: branchId ?? undefined, limit: 20 });
      return data;
    },
    enabled: !!orgId,
  });

  const { data: unpaidCount = 0 } = useQuery({
    queryKey: ['overdue-count', orgId, branchId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await getOverduePaymentCount(orgId, branchId ?? undefined);
      return count;
    },
    enabled: !!orgId,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: absentCount = 0 } = useQuery({
    queryKey: ['absent-today', orgId, branchId, todayStr],
    queryFn: async () => {
      if (!orgId) return 0;
      const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('org_id', orgId)
        .eq('date', todayStr)
        .eq('status', 'absent');
      return new Set(records?.map((r) => r.student_id) ?? []).size;
    },
    enabled: !!orgId,
  });

  const logsByDate = useMemo(() => {
    const map = new Map<string, typeof recentLogs>();
    recentLogs.forEach((log) => {
      const date = log.created_at.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(log);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [recentLogs]);

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Communication
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          WhatsApp templates & broadcast
        </Text>
      </View>
      <View className="px-4 pt-4">
        <Button
          variant="primary"
          size="md"
          className="mb-4"
          onPress={() => setBroadcastOpen(true)}
        >
          Compose Broadcast
        </Button>

        <Text className="mb-2 font-inter-medium text-label-md text-text-secondary">
          Quick actions
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          <Card
            className="min-w-[140px] flex-1"
            onPress={() => setBroadcastOpen(true)}
          >
            <Text className="font-inter-semibold text-body-sm text-text-primary">
              Payment reminders
            </Text>
            <Text className="mt-0.5 font-inter-regular text-caption text-text-tertiary">
              {unpaidCount} unpaid
            </Text>
          </Card>
          <Card
            className="min-w-[140px] flex-1"
            onPress={() => setBroadcastOpen(true)}
          >
            <Text className="font-inter-semibold text-body-sm text-text-primary">
              Absent alerts
            </Text>
            <Text className="mt-0.5 font-inter-regular text-caption text-text-tertiary">
              {absentCount} today
            </Text>
          </Card>
          <Card className="min-w-[140px] flex-1" onPress={() => setBroadcastOpen(true)}>
            <Text className="font-inter-semibold text-body-sm text-text-primary">
              Class cancelled
            </Text>
            <Text className="mt-0.5 font-inter-regular text-caption text-text-tertiary">
              Notify batch
            </Text>
          </Card>
          <Card className="min-w-[140px] flex-1" onPress={() => setBroadcastOpen(true)}>
            <Text className="font-inter-semibold text-body-sm text-text-primary">
              Schedule change
            </Text>
            <Text className="mt-0.5 font-inter-regular text-caption text-text-tertiary">
              Notify batch
            </Text>
          </Card>
        </View>

        <Text className="mb-2 font-inter-semibold text-label-md text-text-primary">
          Recent messages
        </Text>
        {recentLogs.length === 0 ? (
          <Card padding="md">
            <Text className="font-inter-regular text-body-md text-text-tertiary">
              No messages sent yet. Send a broadcast to see recent activity.
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {logsByDate.map(([date, logs]) => (
              <View key={date}>
                <Text className="mb-1 font-inter-medium text-caption text-text-tertiary">
                  {formatDate(date)}
                </Text>
                <View className="gap-2">
                  {logs.map((log) => (
                    <Card key={log.id} padding="md">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-inter-medium text-body-sm text-text-primary">
                          {MESSAGE_TYPE_LABELS[log.message_type] ?? log.message_type}
                        </Text>
                        <Text className="font-inter-regular text-caption text-text-tertiary">
                          {formatRelativeTime(log.created_at)}
                        </Text>
                      </View>
                      <Text className="mt-0.5 font-inter-regular text-caption text-text-secondary">
                        To: {log.recipient_name || log.recipient_phone} · {log.status}
                      </Text>
                    </Card>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <Sheet
        visible={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Compose Broadcast"
        snapPoint={0.7}
      >
        <BroadcastComposer
          onClose={() => setBroadcastOpen(false)}
          onSent={() => setBroadcastOpen(false)}
        />
      </Sheet>
    </ScrollView>
  );
}
