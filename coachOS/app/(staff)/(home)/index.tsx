import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Card, Button, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { canSeeRevenueDashboard } from '@/lib/permissions';
import { getOverduePaymentCount } from '@/services/payments';
import { getAuditLogs } from '@/services/audit-log';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Users, IndianRupee, MessageSquare, Trophy } from 'lucide-react-native';
import { format } from 'date-fns';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTION_LABELS: Record<string, string> = {
  'org.create': 'Academy created',
  'staff.invite_accepted': 'Invite accepted',
  'student.create': 'Student added',
  'student.parent_onboarding_complete': 'Parent onboarding completed',
  'attendance.mark': 'Attendance marked',
  'payment.created': 'Payment created',
  'payment.paid': 'Payment received',
};

export default function StaffHomeScreen() {
  const { user } = useAuth();
  const orgId = user?.orgId;
  const branchId = (user?.profile as { branch_id?: string })?.branch_id;
  const showRevenue = user?.role && canSeeRevenueDashboard(user.role);
  const name = user?.profile && 'full_name' in user.profile
    ? (user.profile as { full_name?: string }).full_name?.split(' ')[0] ?? 'there'
    : 'there';
  const greeting = useMemo(() => `${getTimeGreeting()}, ${name}`, [name]);

  const todayKey = DAY_KEYS[new Date().getDay()];
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: attendanceToday = 0, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-today', orgId, branchId, todayStr],
    queryFn: async () => {
      if (!orgId) return 0;
      let q = supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('date', todayStr);
      if (branchId && user?.role !== 'super_admin') q = q.eq('branch_id', branchId);
      const { count } = await q;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const { data: totalSessionsToday = 0 } = useQuery({
    queryKey: ['sessions-today', orgId, branchId, todayKey],
    queryFn: async () => {
      if (!orgId) return 0;
      const { data: batches } = await supabase
        .from('batches')
        .select('id')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .contains('days_of_week', [todayKey]);
      const batchIds = (batches ?? []).map((b) => b.id);
      if (batchIds.length === 0) return 0;
      let q = supabase.from('students').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('enrollment_status', 'active');
      if (branchId && user?.role !== 'super_admin') q = q.eq('branch_id', branchId);
      const { count } = await q.in('batch_id', batchIds);
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const { data: overdueCount = 0 } = useQuery({
    queryKey: ['overdue-count', orgId, branchId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await getOverduePaymentCount(orgId, branchId ?? undefined);
      return count;
    },
    enabled: !!orgId && !!showRevenue,
  });

  const { data: upcomingMatchesCount = 0 } = useQuery({
    queryKey: ['upcoming-matches-count', orgId, branchId],
    queryFn: async () => {
      if (!orgId) return 0;
      const from = new Date().toISOString().slice(0, 10);
      const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      let q = supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('match_date', from)
        .lte('match_date', to);
      const { count } = await q;
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const { data: queuedMessagesCount = 0 } = useQuery({
    queryKey: ['whatsapp-queued', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await supabase
        .from('whatsapp_logs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'queued');
      return count ?? 0;
    },
    enabled: !!orgId,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['audit-logs-recent', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await getAuditLogs(orgId, {}, 10);
      return data;
    },
    enabled: !!orgId,
  });

  const { data: batchesToday = [] } = useQuery({
    queryKey: ['batches-today', orgId, branchId, todayKey],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from('batches')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .contains('days_of_week', [todayKey]);
      if (branchId && user?.role !== 'super_admin') {
        const { data: bb } = await supabase
          .from('branch_batches')
          .select('batch_id')
          .eq('branch_id', branchId);
        const ids = bb?.map((r) => r.batch_id) ?? [];
        if (ids.length > 0) q = q.in('id', ids);
      }
      const { data } = await q.order('name');
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: !!orgId,
  });

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Dashboard
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          {greeting}
        </Text>
      </View>

      <View className="px-4 pt-4">
        <Text className="mb-3 font-inter-medium text-label-md text-text-secondary">
          Today's overview
        </Text>
        {attendanceLoading ? (
          <View className="flex-row flex-wrap gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="min-w-[140px] h-20 flex-1 rounded-lg" />
            ))}
          </View>
        ) : (
        <View className="flex-row flex-wrap gap-3">
          <Card
            onPress={() => router.push('/(staff)/(attendance)')}
            className="min-w-[140px] flex-1"
          >
            <View className="flex-row items-center gap-2">
              <View className="rounded-md bg-bg-tertiary p-2">
                <ClipboardList size={20} color="#0A0A0A" />
              </View>
              <View>
                <Text className="font-inter-semibold text-h3 text-text-primary">
                  Attendance
                </Text>
                <Text className="font-inter-regular text-caption text-text-tertiary">
                  {attendanceToday}/{totalSessionsToday} marked
                </Text>
              </View>
            </View>
          </Card>
          {showRevenue && (
            <Card
              onPress={() => router.push('/(staff)/(payments)')}
              className="min-w-[140px] flex-1"
            >
              <View className="flex-row items-center gap-2">
                <View className="rounded-md bg-bg-tertiary p-2">
                  <IndianRupee size={20} color="#0A0A0A" />
                </View>
                <View>
                  <Text className="font-inter-semibold text-h3 text-text-primary">
                    Fees due
                  </Text>
                  <Text className="font-inter-regular text-caption text-text-tertiary">
                    {overdueCount} overdue
                  </Text>
                </View>
              </View>
            </Card>
          )}
          <Card
            onPress={() => router.push('/(staff)/(communicate)')}
            className="min-w-[140px] flex-1"
          >
            <View className="flex-row items-center gap-2">
              <View className="rounded-md bg-bg-tertiary p-2">
                <Trophy size={20} color="#0A0A0A" />
              </View>
              <View>
                <Text className="font-inter-semibold text-h3 text-text-primary">
                  Upcoming
                </Text>
                <Text className="font-inter-regular text-caption text-text-tertiary">
                  {upcomingMatchesCount} matches
                </Text>
              </View>
            </View>
          </Card>
          <Card
            onPress={() => router.push('/(staff)/(communicate)')}
            className="min-w-[140px] flex-1"
          >
            <View className="flex-row items-center gap-2">
              <View className="rounded-md bg-bg-tertiary p-2">
                <MessageSquare size={20} color="#0A0A0A" />
              </View>
              <View>
                <Text className="font-inter-semibold text-h3 text-text-primary">
                  Messages
                </Text>
                <Text className="font-inter-regular text-caption text-text-tertiary">
                  {queuedMessagesCount} queued
                </Text>
              </View>
            </View>
          </Card>
        </View>
        )}

        <Text className="mb-3 mt-6 font-inter-medium text-label-md text-text-secondary">
          Quick actions
        </Text>
        <View className="gap-2">
          <Button
            variant="secondary"
            size="md"
            onPress={() => router.push('/(staff)/(attendance)')}
          >
            Take attendance
          </Button>
          <Button
            variant="secondary"
            size="md"
            onPress={() => router.push('/(staff)/(students)/add')}
          >
            Add student
          </Button>
          <Button
            variant="secondary"
            size="md"
            onPress={() => router.push('/(staff)/(communicate)')}
          >
            Send reminder
          </Button>
          <Button
            variant="secondary"
            size="md"
            onPress={() => router.push('/(staff)/(payments)')}
          >
            Collect payment
          </Button>
        </View>

        <Text className="mb-3 mt-6 font-inter-medium text-label-md text-text-secondary">
          Recent activity
        </Text>
        <View className="gap-2">
          {recentActivity.length === 0 ? (
            <Card>
              <Text className="font-inter-regular text-body-md text-text-tertiary">No recent activity</Text>
            </Card>
          ) : (
            recentActivity.map((log: { id: string; action: string; entity_type: string; created_at: string }) => (
              <Card key={log.id} padding="sm">
                <View className="flex-row items-center justify-between">
                  <Text className="font-inter-regular text-body-sm text-text-primary">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </Text>
                  <Text className="font-inter-regular text-caption text-text-tertiary">
                    {format(new Date(log.created_at), 'MMM d, HH:mm')}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
