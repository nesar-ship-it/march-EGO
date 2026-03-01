import { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { getAttendanceRecords } from '@/services/attendance';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

export default function StudentAttendanceScreen() {
  const { user } = useAuth();
  const studentId = (user?.profile as { id?: string })?.id;
  const orgId = user?.orgId;
  const [monthDate, setMonthDate] = useState(() => new Date());

  const dateFrom = useMemo(() => startOfMonth(monthDate).toISOString().slice(0, 10), [monthDate]);
  const dateTo = useMemo(() => endOfMonth(monthDate).toISOString().slice(0, 10), [monthDate]);

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', 'student', studentId, orgId, dateFrom, dateTo],
    queryFn: async () => {
      if (!orgId || !studentId) return [];
      const { data } = await getAttendanceRecords({
        org_id: orgId,
        student_id: studentId,
        date_from: dateFrom,
        date_to: dateTo,
      });
      return data ?? [];
    },
    enabled: !!orgId && !!studentId,
  });

  const attendanceByDate = useMemo(
    () =>
      (attendance as { date: string; status: string }[]).reduce(
        (acc, r) => {
          acc[r.date] = r.status;
          return acc;
        },
        {} as Record<string, string>
      ),
    [attendance]
  );

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const presentCount = (attendance as { status: string }[]).filter((r) => r.status === 'present').length;
  const totalWithStatus = (attendance as { status: string }[]).length;
  const percent = totalWithStatus > 0 ? Math.round((presentCount / totalWithStatus) * 100) : 0;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Attendance
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          Your attendance history
        </Text>
      </View>
      <View className="px-4 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text
            className="font-inter-medium text-body-md text-text-primary"
            onPress={() => setMonthDate((d) => subMonths(d, 1))}
          >
            ← Prev
          </Text>
          <Text className="font-inter-semibold text-body-md text-text-primary">
            {format(monthDate, 'MMMM yyyy')}
          </Text>
          <Text
            className="font-inter-medium text-body-md text-text-primary"
            onPress={() => setMonthDate((d) => addMonths(d, 1))}
          >
            Next →
          </Text>
        </View>

        {isLoading ? (
          <Text className="font-inter-regular text-body-md text-text-tertiary">Loading...</Text>
        ) : (
          <>
            <Card className="mb-3">
              <Text className="font-inter-medium text-label-md text-text-secondary">
                Calendar
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-1">
                {daysInMonth.map((d) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const status = attendanceByDate[dateStr];
                  const isFuture = dateStr > todayStr;
                  const cellStyle = isFuture
                    ? 'bg-transparent border border-border-default'
                    : status === 'present'
                      ? 'bg-status-success'
                      : status === 'absent' || status === 'late'
                        ? 'bg-status-error'
                        : status === 'excused'
                          ? 'bg-status-warning'
                          : 'bg-bg-tertiary';
                  return (
                    <View
                      key={dateStr}
                      className={`h-8 w-8 rounded ${cellStyle}`}
                      style={{ minWidth: 32 }}
                    />
                  );
                })}
              </View>
            </Card>

            <Text className="mb-2 font-inter-regular text-body-md text-text-secondary">
              Present: {presentCount}/{totalWithStatus} sessions ({percent}%)
            </Text>

            {attendance.length === 0 ? (
              <Card>
                <Text className="font-inter-regular text-body-md text-text-secondary">
                  No attendance records for this month
                </Text>
              </Card>
            ) : (
              <View className="gap-2">
                {(attendance as { id: string; date: string; status: string }[])
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((r) => (
                    <Card key={r.id} padding="md">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-inter-medium text-body-md text-text-primary">
                          {formatDate(r.date)}
                        </Text>
                        <Text
                          className={
                            r.status === 'present'
                              ? 'font-inter-medium text-body-md text-status-success'
                              : r.status === 'absent'
                                ? 'font-inter-medium text-body-md text-status-error'
                                : 'font-inter-regular text-body-md text-text-secondary'
                          }
                        >
                          {r.status}
                        </Text>
                      </View>
                    </Card>
                  ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
