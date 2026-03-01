import { View, Text, ScrollView, Linking } from 'react-native';
import { Card, Button } from '@/components/ui';
import { FeeStatusBadge } from '@/components/students';
import { useAuth } from '@/hooks/useAuth';
import { getPayments } from '@/services/payments';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/lib/types';

type PaymentWithLink = Payment & { payment_link_url?: string | null };

export default function StudentPaymentsScreen() {
  const { user } = useAuth();
  const studentId = (user?.profile as { id?: string })?.id;
  const orgId = user?.orgId;

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'student', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return [];
      const { data } = await getPayments({
        org_id: orgId,
        student_id: studentId,
      });
      return (data ?? []) as PaymentWithLink[];
    },
    enabled: !!orgId && !!studentId,
  });

  const student = user?.profile as { fee_status?: string } | null;
  const unpaidPayment = (payments as PaymentWithLink[]).find(
    (p) => p.status === 'pending' || p.status === 'overdue'
  );

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Payments
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          Your fee payment history
        </Text>
      </View>
      <View className="px-4 pt-4">
        <Card className="mb-4">
          <Text className="font-inter-medium text-label-md text-text-secondary">
            Current fee status
          </Text>
          <View className="mt-2">
            {student?.fee_status ? (
              <FeeStatusBadge feeStatus={student.fee_status as 'paid' | 'unpaid' | 'overdue' | 'partial'} />
            ) : (
              <Text className="font-inter-regular text-body-md text-text-primary">—</Text>
            )}
          </View>
          {unpaidPayment && (
            <View className="mt-3">
              <Text className="font-inter-regular text-body-sm text-text-secondary">
                Due: {formatCurrency(unpaidPayment.amount)}
                {unpaidPayment.due_date ? ` · Due by: ${formatDate(unpaidPayment.due_date)}` : ''}
              </Text>
              {(unpaidPayment as PaymentWithLink).payment_link_url ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onPress={() => Linking.openURL((unpaidPayment as PaymentWithLink).payment_link_url!)}
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
              ) : null}
            </View>
          )}
        </Card>

        <Text className="mb-2 font-inter-medium text-label-md text-text-secondary">
          Payment history
        </Text>
        {isLoading ? (
          <Text className="font-inter-regular text-body-md text-text-tertiary">Loading...</Text>
        ) : payments.length === 0 ? (
          <Card>
            <Text className="font-inter-regular text-body-md text-text-secondary">
              No payments yet
            </Text>
          </Card>
        ) : (
          <View className="gap-2">
            {(payments as PaymentWithLink[]).map((p) => (
              <Card key={p.id} padding="md">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-inter-medium text-body-md text-text-primary">
                      {p.period_label}
                    </Text>
                    <Text className="font-inter-regular text-caption text-text-tertiary">
                      {formatCurrency(p.amount)} · {p.status}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-inter-regular text-caption text-text-secondary">
                      {p.paid_at ? formatDate(p.paid_at) : p.due_date ? `Due ${formatDate(p.due_date)}` : '—'}
                    </Text>
                    {p.status === 'paid' && p.invoice_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1"
                        onPress={() => Linking.openURL(p.invoice_url!)}
                      >
                        View Invoice
                      </Button>
                    ) : (p.status === 'pending' || p.status === 'overdue') && (p.payment_link_url || p.invoice_url) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-1"
                        onPress={() => Linking.openURL(p.payment_link_url || p.invoice_url!)}
                      >
                        Pay Now
                      </Button>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
