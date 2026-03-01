import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Button, Select, Toast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/contexts/ToastContext';

const AUDIENCE_OPTIONS = [
  { label: 'All Students', value: 'all' },
  { label: 'Specific Batch', value: 'batch' },
  { label: 'Unpaid Students', value: 'unpaid' },
  { label: 'Absent Today', value: 'absent' },
];

const TEMPLATE_OPTIONS = [
  { label: 'Payment Reminder', value: 'payment_reminder' },
  { label: 'Absent Alert', value: 'absent_alert' },
  { label: 'Class Cancelled', value: 'class_cancelled' },
  { label: 'Custom Announcement', value: 'custom_announcement' },
];

export const BroadcastComposer = ({ onClose, onSent }: { onClose?: () => void, onSent?: () => void }) => {
  const { user } = useAuthStore();
  const orgId = user?.orgId;
  const branchId = user?.branchId; // Used for scoping

  const [audience, setAudience] = useState('all');
  const [template, setTemplate] = useState('custom_announcement');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState<{label: string, value: string}[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (orgId) {
      loadBatches();
    }
  }, [orgId]);

  const loadBatches = async () => {
    let query = supabase.from('batches').select('id, name').eq('org_id', orgId!);
    if (branchId) query = query.eq('branch_id', branchId);
    
    const { data } = await query;
    if (data) {
      setBatches(data.map(b => ({ label: b.name, value: b.id })));
    }
  };

  const handleSend = async () => {
    if (audience === 'batch' && !selectedBatchId) {
      showToast('Please select a batch', 'error');
      return;
    }

    setIsSending(true);

    try {
      let targetStudentIds: string[] = [];

      // Resolve audience
      if (audience === 'all') {
        const { data } = await supabase.from('students').select('id').eq('org_id', orgId!).eq('is_active', true);
        targetStudentIds = data?.map(d => d.id) || [];
      } else if (audience === 'batch') {
        const { data } = await supabase.from('student_batches').select('student_id').eq('batch_id', selectedBatchId);
        targetStudentIds = data?.map(d => d.student_id) || [];
      } else if (audience === 'unpaid') {
        const { data } = await supabase.from('payments').select('student_id').eq('org_id', orgId!).in('status', ['pending', 'overdue']);
        targetStudentIds = Array.from(new Set(data?.map(d => d.student_id) || []));
      } else if (audience === 'absent') {
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data } = await supabase.from('attendance_records').select('student_id').eq('org_id', orgId!).eq('date', todayStr).eq('status', 'absent');
        targetStudentIds = Array.from(new Set(data?.map(d => d.student_id) || []));
      }

      if (targetStudentIds.length === 0) {
        showToast('No students found in the selected audience.', 'info');
        setIsSending(false);
        return;
      }

      // Invoke edge function
      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          org_id: orgId,
          template_name: template,
          student_ids: targetStudentIds,
          // We can optionally pass custom_text if it's a custom template, but we are keeping it simple for now based on PRD stubs
        }
      });

      if (error) throw error;

      showToast(`Broadcast queued for ${targetStudentIds.length} students.`, 'success');
      if (onSent) onSent();
      
    } catch (error: any) {
      showToast(error.message || 'Failed to send broadcast', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View className="p-6">
      <Text className="font-inter-regular text-body-md text-text-secondary mb-6">
        Select your audience and message template. Messages will be sent via WhatsApp.
      </Text>

      <View className="mb-4">
        <Text className="font-inter-medium text-caption text-text-secondary mb-1">Target Audience</Text>
        <Select 
          value={audience}
          onValueChange={setAudience}
          options={AUDIENCE_OPTIONS}
        />
      </View>

      {audience === 'batch' && (
        <View className="mb-4">
          <Text className="font-inter-medium text-caption text-text-secondary mb-1">Select Batch</Text>
          <Select 
            value={selectedBatchId}
            onValueChange={setSelectedBatchId}
            options={[
              { label: '-- Select Batch --', value: '' },
              ...batches
            ]}
          />
        </View>
      )}

      <View className="mb-6">
        <Text className="font-inter-medium text-caption text-text-secondary mb-1">Message Template</Text>
        <Select 
          value={template}
          onValueChange={setTemplate}
          options={TEMPLATE_OPTIONS}
        />
      </View>

      <View className="flex-row gap-3">
        {onClose && (
          <Button variant="secondary" className="flex-1" onPress={onClose} disabled={isSending}>
            Cancel
          </Button>
        )}
        <Button variant="primary" className="flex-1" loading={isSending} onPress={handleSend}>
          Send Broadcast
        </Button>
      </View>
    </View>
  );
};
