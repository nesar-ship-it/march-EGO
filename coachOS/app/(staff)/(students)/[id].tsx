import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button, Avatar, Sheet, Card, Input, Select } from '@/components/ui';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FeeStatusBadge, ProfileCompletionBadge, QRCodeCard } from '@/components/students';
import { getStudentById, resetStudentPassword } from '@/services/students';
import { createCoachNote } from '@/services/coach-notes';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { getAttendanceRecords } from '@/services/attendance';
import { getPayments } from '@/services/payments';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { createParentOnboardingUrl, formatDate, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { canResetStudentPassword } from '@/lib/permissions';
import { NOTE_TYPES } from '@/lib/constants';
import type { Student } from '@/lib/types';

type TabId = 'profile' | 'attendance' | 'payments' | 'notes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payments', label: 'Payments' },
  { id: 'notes', label: 'Notes' },
];

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orgId = useAuthStore((s) => s.user?.orgId);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('profile');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [newPasswordSheetOpen, setNewPasswordSheetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  const staffId = (useAuthStore((s) => s.user?.profile) as { id?: string })?.id;
  const canReset = role ? canResetStudentPassword(role) : false;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [addNoteSheetOpen, setAddNoteSheetOpen] = useState(false);
  const [noteType, setNoteType] = useState<string>('general');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !orgId) return;
    getStudentById({ student_id: id, org_id: orgId }).then(({ student: s }) => {
      setStudent(s ?? null);
      setLoading(false);
    });
  }, [id, orgId]);

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', 'student', id, orgId],
    queryFn: async () => {
      if (!orgId || !id) return [];
      const { data } = await getAttendanceRecords({ org_id: orgId, student_id: id });
      return data ?? [];
    },
    enabled: !!orgId && !!id && tab === 'attendance',
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'student', id, orgId],
    queryFn: async () => {
      if (!orgId || !id) return [];
      const { data } = await getPayments({ org_id: orgId, student_id: id });
      return data ?? [];
    },
    enabled: !!orgId && !!id && tab === 'payments',
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['coach_notes', id, orgId],
    queryFn: async () => {
      if (!orgId || !id) return [];
      const { data } = await supabase
        .from('coach_notes')
        .select('*')
        .eq('student_id', id)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!orgId && !!id && tab === 'notes',
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="font-inter-regular text-body-md text-text-tertiary">
          Loading...
        </Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center font-inter-semibold text-h3 text-text-primary">
          Student not found
        </Text>
        <Button variant="secondary" size="md" className="mt-4" onPress={() => router.back()}>
          Back
        </Button>
      </View>
    );
  }

  const fullName = `${student.first_name}${student.last_name ? ` ${student.last_name}` : ''}`;
  const onboardingUrl = student.parent_onboarding_token
    ? createParentOnboardingUrl(student.parent_onboarding_token)
    : '';
  const batchName = (student.batch as { name?: string } | null)?.name;
  const ageGroupName = (student.age_group as { name?: string } | null)?.name;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          ← Back
        </Button>

        <View className="mt-4 flex-row items-center gap-4">
          <Avatar name={fullName} size="lg" imageUrl={null} />
          <View className="flex-1">
            <Text className="font-inter-semibold text-h2 text-text-primary">
              {fullName}
            </Text>
            <Text className="font-mono text-caption text-text-tertiary">
              ID: {student.student_id_code}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              <FeeStatusBadge feeStatus={student.fee_status} />
              <ProfileCompletionBadge student={student} />
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row border-b border-border-default">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                className="flex-1 items-center pb-3"
                style={({ pressed }) => [
                  pressed && { opacity: 0.8 },
                  isActive && { borderBottomWidth: 2, borderBottomColor: '#0A0A0A' },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t.label}
              >
                <Text
                  className={`font-inter-medium text-label-md ${
                    isActive ? 'text-interactive-primary' : 'text-text-tertiary'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'profile' && (
          <View className="mt-6">
            <View className="gap-4">
              {batchName && (
                <Text className="font-inter-regular text-body-md text-text-secondary">
                  Batch: {batchName}
                </Text>
              )}
              {ageGroupName && (
                <Text className="font-inter-regular text-body-md text-text-secondary">
                  Age group: {ageGroupName}
                </Text>
              )}
            </View>
            <View className="mt-6 flex-row flex-wrap gap-3">
              <Button
                variant="secondary"
                size="md"
                onPress={() =>
                  router.push({
                    pathname: '/(staff)/(payments)/[studentId]',
                    params: { studentId: student.id },
                  })
                }
              >
                View payments
              </Button>
              {canReset && student.auth_user_id ? (
                <Button variant="secondary" size="md" onPress={() => setResetConfirmOpen(true)}>
                  Reset password
                </Button>
              ) : null}
            </View>
            {onboardingUrl && !student.parent_onboarding_completed_at && (
              <View className="mt-6">
                <QRCodeCard value={onboardingUrl} size={180} title="Share with parent" />
              </View>
            )}
          </View>
        )}

        {tab === 'attendance' && (
          <View className="mt-6">
            {attendance.length === 0 ? (
              <Text className="font-inter-regular text-body-md text-text-tertiary">
                No attendance records yet.
              </Text>
            ) : (
              <View className="gap-2">
                {attendance.map((r: { id: string; date: string; status: string }) => (
                  <Card key={r.id} padding="md">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-inter-medium text-body-md text-text-primary">
                        {formatDate(r.date)}
                      </Text>
                      <Text
                        className={`font-inter-medium text-body-sm ${
                          r.status === 'present' ? 'text-status-success' : r.status === 'absent' ? 'text-status-error' : 'text-text-secondary'
                        }`}
                      >
                        {r.status}
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === 'payments' && (
          <View className="mt-6">
            <Button
              variant="primary"
              size="sm"
              className="mb-4"
              onPress={() =>
                router.push({
                  pathname: '/(staff)/(payments)/collect',
                  params: { studentId: student.id },
                })
              }
            >
              Record payment
            </Button>
            {payments.length === 0 ? (
              <Text className="font-inter-regular text-body-md text-text-tertiary">
                No payments yet.
              </Text>
            ) : (
              <View className="gap-2">
                {payments.map((p: { id: string; period_label: string; amount: number; status: string; due_date?: string | null }) => (
                  <Card key={p.id} padding="md">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-inter-medium text-body-md text-text-primary">
                          {p.period_label}
                        </Text>
                        <Text className="font-inter-regular text-caption text-text-tertiary">
                          {p.due_date ? formatDate(p.due_date) : '—'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-inter-semibold text-body-md text-text-primary">
                          {formatCurrency(p.amount)}
                        </Text>
                        <Text
                          className={`font-inter-regular text-caption ${
                            p.status === 'paid' ? 'text-status-success' : 'text-status-warning'
                          }`}
                        >
                          {p.status}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === 'notes' && (
          <View className="mt-6">
            <Button
              variant="secondary"
              size="sm"
              className="mb-4"
              onPress={() => {
                setNoteType('general');
                setNoteTitle('');
                setNoteBody('');
                setAddNoteSheetOpen(true);
              }}
            >
              Add note
            </Button>
            {notes.length === 0 ? (
              <Text className="font-inter-regular text-body-md text-text-tertiary">
                No coach notes yet.
              </Text>
            ) : (
              <View className="gap-3">
                {notes.map((n: { id: string; note_type: string; title?: string | null; body: string; created_at: string }) => (
                  <Card key={n.id} padding="md">
                    <Text className="font-inter-medium text-label-sm text-text-tertiary">
                      {NOTE_TYPES.find((t) => t.value === n.note_type)?.label ?? n.note_type}
                    </Text>
                    {n.title ? (
                      <Text className="mt-1 font-inter-semibold text-body-md text-text-primary">
                        {n.title}
                      </Text>
                    ) : null}
                    <Text className="mt-1 font-inter-regular text-body-md text-text-secondary">
                      {n.body}
                    </Text>
                    <Text className="mt-2 font-inter-regular text-caption text-text-tertiary">
                      {formatDate(n.created_at)}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={resetConfirmOpen}
        title="Reset password"
        message="Generate a new password for this student? They will need to use it on next login. Share the new password securely (e.g. via WhatsApp)."
        confirmLabel="Reset"
        variant="danger"
        loading={resetLoading}
        onConfirm={async () => {
          setResetLoading(true);
          const { newPassword: pwd, error } = await resetStudentPassword(student.id);
          setResetLoading(false);
          setResetConfirmOpen(false);
          if (error) return;
          setNewPassword(pwd ?? null);
          setNewPasswordSheetOpen(true);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />

      <Sheet
        visible={newPasswordSheetOpen}
        onClose={() => {
          setNewPasswordSheetOpen(false);
          setNewPassword(null);
        }}
        title="New password"
        snapPoint={0.5}
      >
        <View>
          <Text className="font-inter-regular text-body-md text-text-secondary">
            Share this password with the student or parent. It cannot be retrieved later.
          </Text>
          <Text className="mt-2 font-inter-medium text-label-sm text-text-primary">
            Username: {student?.username ?? '—'}
          </Text>
          <Text className="mt-1 font-mono text-body-lg text-text-primary" selectable>
            Password: {newPassword ?? '—'}
          </Text>
          <Button
            variant="secondary"
            size="md"
            className="mt-4"
            onPress={() => newPassword && Clipboard.setStringAsync(`Username: ${student?.username ?? ''} | Password: ${newPassword}`)}
          >
            Copy credentials
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="mt-2"
            onPress={() => {
              const msg = `Student login – Username: ${student?.username ?? ''} | Password: ${newPassword ?? ''}`;
              Linking.openURL('whatsapp://send?text=' + encodeURIComponent(msg));
            }}
          >
            Share via WhatsApp
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="mt-2"
            onPress={() => {
              setNewPasswordSheetOpen(false);
              setNewPassword(null);
            }}
          >
            Done
          </Button>
        </View>
      </Sheet>

      <Sheet
        visible={addNoteSheetOpen}
        onClose={() => setAddNoteSheetOpen(false)}
        title="Add coach note"
        snapPoint={0.6}
      >
        <View className="gap-4">
          <Select
            label="Type"
            value={noteType}
            onValueChange={setNoteType}
            options={NOTE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            placeholder="Select type"
          />
          <Input
            label="Title (optional)"
            placeholder="e.g. Practice plan for this week"
            value={noteTitle}
            onChangeText={setNoteTitle}
          />
          <Input
            label="Note"
            placeholder="Enter note content..."
            value={noteBody}
            onChangeText={setNoteBody}
            multiline
            numberOfLines={4}
          />
          <Button
            variant="primary"
            size="md"
            disabled={!noteBody.trim() || noteSubmitting}
            onPress={async () => {
              if (!orgId || !id || !staffId) return;
              setNoteSubmitting(true);
              const { error } = await createCoachNote({
                org_id: orgId,
                student_id: id,
                note_type: noteType as 'diet' | 'practice' | 'improvement' | 'general',
                title: noteTitle.trim() || undefined,
                body: noteBody.trim(),
                created_by: staffId,
              });
              setNoteSubmitting(false);
              if (error) {
                showToast(error.message, 'error');
                return;
              }
              showToast('Note added.', 'success');
              setAddNoteSheetOpen(false);
              setNoteTitle('');
              setNoteBody('');
              queryClient.invalidateQueries({ queryKey: ['coach_notes', id, orgId] });
            }}
          >
            {noteSubmitting ? 'Saving...' : 'Save note'}
          </Button>
        </View>
      </Sheet>
    </View>
  );
}
