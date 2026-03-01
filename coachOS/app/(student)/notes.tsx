import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { NOTE_TYPES } from '@/lib/constants';

const FILTERS = [{ value: 'all', label: 'All' }, ...NOTE_TYPES.map((t) => ({ value: t.value, label: t.label }))];

export default function StudentNotesScreen() {
  const { user } = useAuth();
  const studentId = (user?.profile as { id?: string })?.id;
  const orgId = user?.orgId;
  const [filter, setFilter] = useState<string>('all');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['coach_notes', studentId, orgId],
    queryFn: async () => {
      if (!orgId || !studentId) return [];
      const { data } = await supabase
        .from('coach_notes')
        .select('id, note_type, title, body, created_at, coach_id')
        .eq('student_id', studentId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      const notes = (data ?? []) as { id: string; note_type: string; title: string | null; body: string; created_at: string; coach_id: string }[];
      const coachIds = [...new Set(notes.map((n) => n.coach_id))];
      const coachMap: Record<string, string> = {};
      if (coachIds.length > 0) {
        const { data: staff } = await supabase.from('staff_profiles').select('id, full_name').in('id', coachIds);
        (staff ?? []).forEach((s: { id: string; full_name: string }) => {
          coachMap[s.id] = s.full_name ?? 'Coach';
        });
      }
      return notes.map((n) => ({ ...n, coachName: coachMap[n.coach_id] ?? 'Coach' }));
    },
    enabled: !!orgId && !!studentId,
  });

  const filteredNotes =
    filter === 'all'
      ? notes
      : notes.filter((n) => n.note_type === filter);

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="border-b border-border-default bg-white px-4 pb-4 pt-12">
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Coach notes
        </Text>
        <Text className="mt-0.5 font-inter-regular text-body-md text-text-secondary">
          Notes from your coach
        </Text>
      </View>
      <View className="px-4 pt-4">
        <View className="mb-3 flex-row flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Text
              key={f.value}
              className={`rounded-full px-3 py-1.5 font-inter-medium text-caption ${
                filter === f.value ? 'bg-text-primary text-white' : 'bg-bg-tertiary text-text-secondary'
              }`}
              onPress={() => setFilter(f.value)}
            >
              {f.label}
            </Text>
          ))}
        </View>
        {isLoading ? (
          <Text className="font-inter-regular text-body-md text-text-tertiary">Loading...</Text>
        ) : filteredNotes.length === 0 ? (
          <Card>
            <Text className="font-inter-regular text-body-md text-text-secondary">
              No notes yet
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {filteredNotes.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function NoteCard({
  note,
}: {
  note: {
    id: string;
    note_type: string;
    title: string | null;
    body: string;
    created_at: string;
    coachName: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const label = NOTE_TYPES.find((t) => t.value === note.note_type)?.label ?? note.note_type;

  return (
    <Card padding="md" onPress={() => setExpanded((e) => !e)}>
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="rounded bg-bg-tertiary px-2 py-0.5">
          <Text className="font-inter-medium text-caption text-text-secondary">{label}</Text>
        </View>
      </View>
      {note.title ? (
        <Text className="mt-1 font-inter-semibold text-body-md text-text-primary">
          {note.title}
        </Text>
      ) : null}
      <Text className="mt-1 font-inter-regular text-body-sm text-text-secondary" numberOfLines={expanded ? undefined : 2}>
        {note.body}
      </Text>
      <Text className="mt-2 font-inter-regular text-caption text-text-tertiary">
        {note.coachName} · {formatRelativeTime(note.created_at)}
      </Text>
    </Card>
  );
}
