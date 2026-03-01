import { View, Text, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { Card, Button } from '@/components/ui';
import { FeeStatusBadge } from '@/components/students';
import { useAuth } from '@/hooks/useAuth';
import { getAttendanceRecords } from '@/services/attendance';
import { getPayments } from '@/services/payments';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatDate, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { NOTE_TYPES } from '@/lib/constants';
import type { Payment } from '@/lib/types';

export default function StudentHomeScreen() {
  const { user } = useAuth();
  const studentId = (user?.profile as { id?: string })?.id;
  const orgId = user?.orgId;

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', 'student', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return [];
      const { data } = await getAttendanceRecords({
        org_id: orgId,
        student_id: studentId,
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        date_to: new Date().toISOString().slice(0, 10),
      });
      return data ?? [];
    },
    enabled: !!orgId && !!studentId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'student', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return [];
      const { data } = await getPayments({
        org_id: orgId,
        student_id: studentId,
      });
      return (data ?? []) as Payment[];
    },
    enabled: !!orgId && !!studentId,
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data: upcomingMatch } = useQuery({
    queryKey: ['upcoming-match', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return null;
      const { data: participants } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('student_id', studentId);
      const matchIds = participants?.map((p) => p.match_id) ?? [];
      if (matchIds.length === 0) return null;
      const { data } = await supabase
        .from('matches')
        .select('id, title, match_date, location')
        .in('id', matchIds)
        .eq('org_id', orgId)
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data as { id: string; title: string; match_date: string; location: string | null } | null;
    },
    enabled: !!orgId && !!studentId,
  });

  const { data: latestNote } = useQuery({
    queryKey: ['latest-coach-note', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return null;
      const { data } = await supabase
        .from('coach_notes')
        .select('id, note_type, title, body, created_at')
        .eq('student_id', studentId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { id: string; note_type: string; title: string | null; body: string; created_at: string } | null;
    },
    enabled: !!orgId && !!studentId,
  });

  const { data: org } = useQuery({
    queryKey: ['org', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase.from('organizations').select('name').eq('id', orgId).single();
      return data as { name: string } | null;
    },
    enabled: !!orgId,
  });

  const student = user?.profile as { fee_status?: string; first_name?: string; last_name?: string } | null;
  const firstName = student?.first_name ?? '';
  const fullName = student
    ? `${student.first_name ?? ''}${student.last_name ? ` ${student.last_name}` : ''}`
    : '';

  // This week Mon–Sun for 7-day bubbles
  const getWeekDates = () => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };
  const weekDates = getWeekDates();
  const attendanceByDate = (attendance as { date: string; status: string }[]).reduce(
    (acc, r) => {
      acc[r.date] = r.status;
      return acc;
    },
    {} as Record<string, string>
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const unpaidPayment = (payments as Payment[]).find(
    (p) => p.status === 'pending' || p.status === 'overdue'
  );
  const hasDue = !!unpaidPayment && student?.fee_status && student.fee_status !== 'paid';

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Hi, {firstName || 'there'}
        </Text>
        {org?.name ? (
          <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
            {org.name}
          </Text>
        ) : null}
      </View>
      <View className="px-4 pt-4">
        <Card className="mb-3">
          <Text className="font-inter-medium text-label-md text-text-secondary">
            Fee status
          </Text>
          <View className="mt-2">
            {student?.fee_status ? (
              <FeeStatusBadge feeStatus={student.fee_status as 'paid' | 'unpaid' | 'overdue' | 'partial'} />
            ) : (
              <Text className="font-inter-regular text-body-md text-text-primary">—</Text>
            )}
          </View>
          {hasDue && unpaidPayment && (
            <View className="mt-3">
              <Text className="font-inter-regular text-body-sm text-text-secondary">
                Due: {formatCurrency(unpaidPayment.amount)}
                {unpaidPayment.due_date ? ` · Due by: ${formatDate(unpaidPayment.due_date)}` : ''}
              </Text>
              {(unpaidPayment as Payment & { payment_link_url?: string }).payment_link_url ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onPress={() => Linking.openURL((unpaidPayment as Payment & { payment_link_url?: string }).payment_link_url!)}
                >
                  Pay Now
                </Button>
              ) : unpaidPayment.invoice_url ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onPress={() => Linking.openURL(unpaidPayment.invoice_url!)}
                >
                  Pay Now
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onPress={() => router.push('/(student)/payments')}
                >
                  View payments
                </Button>
              )}
            </View>
          )}
        </Card>
        <Card className="mb-3">
          <Text className="font-inter-medium text-label-md text-text-secondary">
            This week's attendance
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {weekDates.map((date, i) => {
              const status = attendanceByDate[date];
              const isFuture = date > todayStr;
              const bubbleStyle = isFuture
                ? 'bg-transparent border-2 border-border-default'
                : status === 'present'
                  ? 'bg-status-success'
                  : status === 'absent' || status === 'late' || status === 'excused'
                    ? 'bg-status-error'
                    : 'bg-bg-tertiary';
              return (
                <View key={date} className="items-center">
                  <View
                    className={`h-10 w-10 rounded-full ${bubbleStyle}`}
                  />
                  <Text className="mt-1 font-inter-regular text-caption text-text-secondary">
                    {dayLabels[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {upcomingMatch && (
          <Card className="mb-3" onPress={() => router.push('/(student)/matches')}>
            <Text className="font-inter-medium text-label-md text-text-secondary">
              Upcoming match
            </Text>
            <Text className="mt-1 font-inter-semibold text-body-md text-text-primary">
              {upcomingMatch.title}
            </Text>
            <Text className="mt-0.5 font-inter-regular text-body-sm text-text-secondary">
              {formatDate(upcomingMatch.match_date)}
              {upcomingMatch.location ? ` · ${upcomingMatch.location}` : ''}
            </Text>
          </Card>
        )}

        {latestNote && (
          <Card className="mb-3" onPress={() => router.push('/(student)/notes')}>
            <Text className="font-inter-medium text-label-md text-text-secondary">
              Latest from coach
            </Text>
            <Text className="mt-1 font-inter-medium text-body-sm text-text-primary">
              {NOTE_TYPES.find((t) => t.value === latestNote.note_type)?.label ?? latestNote.note_type}
              {latestNote.title ? `: ${latestNote.title}` : ''}
            </Text>
            <Text className="mt-0.5 font-inter-regular text-caption text-text-tertiary" numberOfLines={2}>
              {latestNote.body}
            </Text>
            <Text className="mt-1 font-inter-regular text-caption text-text-tertiary">
              {formatRelativeTime(latestNote.created_at)}
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
