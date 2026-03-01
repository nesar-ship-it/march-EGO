import { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Search, ChevronDown, CheckCircle, Bell, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { Card, Input, Select, Badge, Button, Toast } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { getPayments } from '@/services/payments';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// Mocked months for selector
const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'];
const STATUSES = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Partial', value: 'partial' },
];

export default function PaymentsOverviewScreen() {
  const { user } = useAuthStore();
  const orgId = user?.orgId;
  const role = user?.role;
  const isCoach = role === 'coach';

  const [selectedMonth, setSelectedMonth] = useState('Mar 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', orgId, selectedMonth],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await getPayments({ org_id: orgId });
      // In a real app, we'd filter by selectedMonth here via the API `period_label`
      return (data || []).map((p: any) => ({
        ...p,
        // Mocking student data since getPayments doesn't join yet
        student: p.students || { full_name: 'Unknown Student' }
      }));
    },
    enabled: !!orgId,
  });

  const filteredPayments = useMemo(() => {
    return payments.filter((p: any) => {
      const matchSearch = p.student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [payments, searchQuery, selectedStatus]);

  const summary = useMemo(() => {
    return payments.reduce((acc: any, p: any) => {
      if (p.status === 'paid') {
        acc.collected += p.amount;
        acc.collectedCount++;
      } else if (p.status === 'pending') {
        acc.pending += p.amount;
        acc.pendingCount++;
      } else if (p.status === 'overdue') {
        acc.overdue += p.amount;
        acc.overdueCount++;
      }
      return acc;
    }, { collected: 0, collectedCount: 0, pending: 0, pendingCount: 0, overdue: 0, overdueCount: 0 });
  }, [payments]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'partial': return 'warning';
      default: return 'default';
    }
  };

  return (
    <View className="flex-1 bg-bg-secondary">
      {/* Header */}
      <View className="bg-white border-b border-border-default pt-12 pb-4 px-4 shadow-sm z-10">
        <View className="flex-row items-center justify-between">
          <Text className="font-inter-semibold text-h2 text-text-primary">Payments</Text>
          {!isCoach && (
            <Button variant="primary" size="sm" icon={Plus} onPress={() => router.push('/(staff)/(payments)/create')}>
              Create Records
            </Button>
          )}
        </View>

        {/* Month Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 flex-row">
          {MONTHS.map(month => (
            <TouchableOpacity 
              key={month}
              onPress={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-full mr-2 ${selectedMonth === month ? 'bg-text-primary' : 'bg-bg-tertiary'}`}
            >
              <Text className={`font-inter-medium text-body-sm ${selectedMonth === month ? 'text-white' : 'text-text-secondary'}`}>
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Summary Cards */}
        {!isCoach && (
          <View className="flex-row justify-between mb-6 gap-2">
            <Card className="flex-1 p-3 border-status-success/30 bg-status-success/5">
              <Text className="font-inter-regular text-caption text-text-secondary">Collected</Text>
              <Text className="font-inter-semibold text-body-lg text-text-primary mt-1">
                {formatCurrency(summary.collected)}
              </Text>
              <Text className="font-inter-regular text-caption text-text-tertiary mt-1">
                {summary.collectedCount} students
              </Text>
            </Card>
            <Card className="flex-1 p-3 border-status-warning/30 bg-status-warning/5">
              <Text className="font-inter-regular text-caption text-text-secondary">Pending</Text>
              <Text className="font-inter-semibold text-body-lg text-text-primary mt-1">
                {formatCurrency(summary.pending)}
              </Text>
              <Text className="font-inter-regular text-caption text-text-tertiary mt-1">
                {summary.pendingCount} students
              </Text>
            </Card>
            <Card className="flex-1 p-3 border-status-error/30 bg-status-error/5">
              <Text className="font-inter-regular text-caption text-text-secondary">Overdue</Text>
              <Text className="font-inter-semibold text-body-lg text-text-primary mt-1">
                {formatCurrency(summary.overdue)}
              </Text>
              <Text className="font-inter-regular text-caption text-text-tertiary mt-1">
                {summary.overdueCount} students
              </Text>
            </Card>
          </View>
        )}

        {/* Filters */}
        <View className="flex-row gap-2 mb-4 z-20">
          <View className="flex-1">
            <Input 
              placeholder="Search student..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
          </View>
          <View className="w-1/3">
            <Select 
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              options={STATUSES}
            />
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator size="large" color="#0A0A0A" />
          </View>
        ) : filteredPayments.length === 0 ? (
          <View className="py-8 border border-dashed border-border-default rounded-lg items-center justify-center">
            <Text className="font-inter-regular text-body-md text-text-tertiary">No payment records found.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredPayments.map((payment: any) => (
              <Card key={payment.id} className="p-4" padding="none">
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="font-inter-semibold text-body-md text-text-primary">
                      {payment.student.full_name}
                    </Text>
                    {payment.due_date && !isCoach && (
                      <Text className="font-inter-regular text-caption text-text-tertiary mt-0.5">
                        Due: {formatDate(payment.due_date)}
                      </Text>
                    )}
                  </View>
                  <View className="items-end gap-1 flex-row">
                    {!isCoach && payment.amount && (
                      <Text className="font-inter-semibold text-body-md text-text-primary mr-2">
                        {formatCurrency(payment.amount)}
                      </Text>
                    )}
                    <Badge variant={getStatusColor(payment.status) as any}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </View>
                </View>
                
                {/* Actions Row */}
                {!isCoach && (payment.status === 'pending' || payment.status === 'overdue') && (
                  <View className="mt-3 pt-3 border-t border-border-subtle flex-row justify-end gap-3">
                    <TouchableOpacity className="flex-row items-center">
                      <Bell size={16} color="#404040" className="mr-1" />
                      <Text className="font-inter-medium text-caption text-text-secondary">Remind</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center pl-3 border-l border-border-subtle">
                      <CheckCircle size={16} color="#059669" className="mr-1" />
                      <Text className="font-inter-medium text-caption text-status-success">Mark Paid</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bulk Action (Admins Only) */}
      {!isCoach && summary.pendingCount + summary.overdueCount > 0 && (
        <View className="absolute bottom-6 left-4 right-4 items-center">
          <Button variant="primary" size="lg" icon={Bell} className="shadow-lg" onPress={() => {}}>
            {`Send Reminders (${summary.pendingCount + summary.overdueCount})`}
          </Button>
        </View>
      )}
    </View>
  );
}
