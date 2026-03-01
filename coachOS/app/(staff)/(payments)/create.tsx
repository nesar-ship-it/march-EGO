import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Button, Input, Select, Toast } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

export default function CreatePaymentRecordsScreen() {
  const { user } = useAuthStore();
  const orgId = user?.orgId;
  const branchId = user?.branchId; // Super admins might not have a branchId initially or they have one for context
  
  const [periodLabel, setPeriodLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetType, setTargetType] = useState('all'); // 'all', 'batch'
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState<{label: string, value: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleCreate = async () => {
    if (!periodLabel || !amount || !dueDate) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (targetType === 'batch' && !selectedBatchId) {
      showToast('Please select a batch', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fetch target students
      let studentQuery = supabase
        .from('students')
        .select('id, branch_id')
        .eq('org_id', orgId!)
        .eq('is_active', true);
      
      if (branchId) {
        studentQuery = studentQuery.eq('branch_id', branchId);
      }
      
      const { data: students, error: studentError } = await studentQuery;
      
      if (studentError || !students || students.length === 0) {
        showToast('No active students found.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Filter by batch if needed (using batch_id array assumes we selected students directly, but here we can't easily join in one query without a complex RPC. We'll implement a simplified filtering for 'all' vs 'batch')
      
      let applicableStudents = students;
      
      if (targetType === 'batch') {
        const { data: batchStudents } = await supabase
          .from('student_batches')
          .select('student_id')
          .eq('batch_id', selectedBatchId);
          
        const batchStudentIds = batchStudents?.map(s => s.student_id) || [];
        applicableStudents = students.filter(s => batchStudentIds.includes(s.id));
      }

      if (applicableStudents.length === 0) {
        showToast('No active students found in target group.', 'info');
        setIsSubmitting(false);
        return;
      }

      // 2. Fetch existing payments for this period to avoid duplicates
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('student_id')
        .eq('org_id', orgId!)
        .eq('period_label', periodLabel);

      const existingStudentIds = new Set(existingPayments?.map(p => p.student_id) || []);

      const newPayments = applicableStudents
        .filter(s => !existingStudentIds.has(s.id))
        .map(s => ({
          org_id: orgId!,
          branch_id: s.branch_id,
          student_id: s.id,
          amount: parseFloat(amount),
          period_label: periodLabel,
          due_date: dueDate,
          status: 'pending',
          currency: 'INR'
        }));

      if (newPayments.length === 0) {
        showToast('All students already have records for this period.', 'info');
        setIsSubmitting(false);
        router.back();
        return;
      }

      // 3. Insert and audit
      const { error: insertError } = await supabase.from('payments').insert(newPayments);

      if (insertError) throw insertError;

      // Note: We'd also log to 'audit_logs' here
      
      showToast(`Created ${newPayments.length} payment records successfully.`, 'success');
      router.back();
      
    } catch (e: any) {
      showToast(e.message || 'Failed to create payment records', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-white">
      <View className="px-6 py-4 pt-12 flex-row items-center border-b border-border-default">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text className="font-inter-semibold text-h2 text-text-primary ml-4">
          Create Payment Records
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Text className="font-inter-regular text-body-md text-text-secondary mb-8">
          Generate payment records for your students. This sets what they owe for the selected billing cycle.
        </Text>

        <View className="gap-6 mb-8">
          <Input 
            label="Billing Period" 
            placeholder="e.g. March 2026, Q1 2026"
            value={periodLabel}
            onChangeText={setPeriodLabel}
          />
          
          <Input 
            label="Amount (₹)" 
            placeholder="3000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          
          <Input 
            label="Due Date" 
            placeholder="YYYY-MM-DD"
            value={dueDate}
            onChangeText={setDueDate}
          />

          <View>
            <Text className="font-inter-medium text-caption text-text-secondary mb-1">Apply To</Text>
            <Select 
              value={targetType}
              onValueChange={setTargetType}
              options={[
                { label: 'All active students', value: 'all' },
                { label: 'Specific batch', value: 'batch' },
              ]}
            />
          </View>

          {targetType === 'batch' && (
            <View>
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

        </View>

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          loading={isSubmitting}
          onPress={handleCreate}
        >
          Create Records
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
