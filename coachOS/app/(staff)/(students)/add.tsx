import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { createStudent } from '@/services/students';
import { supabase } from '@/lib/supabase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStudentSchema } from '@/lib/validators';
import type { z } from 'zod';

type FormData = z.infer<typeof createStudentSchema>;

export default function AddStudentScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createStudentSchema) as never,
    defaultValues: { first_name: '', last_name: '', parent_phone: '' },
  });

  const onSubmit = async (data: FormData) => {
    if (!user?.orgId || !user?.profile) return;
    const branchId = (user.profile as { branch_id?: string }).branch_id;
    if (!branchId && user.role !== 'super_admin') return;
    const orgId = user.orgId;
    const branchIdToUse = branchId ?? (await getFirstBranchId(orgId));
    if (!branchIdToUse) return;

    setLoading(true);
    const { data: result, error } = await createStudent({
      branch_id: branchIdToUse,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      blood_group: data.blood_group,
      parent_phone: data.parent_phone,
    });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    if (result) {
      const studentName = `${data.first_name}${data.last_name ? ` ${data.last_name}` : ''}`;
      router.replace({
        pathname: '/(staff)/(students)/onboarding-link',
        params: {
          studentId: result.student_id,
          studentIdCode: result.student_id_code,
          username: result.username,
          tempPassword: result.password,
          parentToken: result.parent_onboarding_token,
          parentOnboardingUrl: result.parent_onboarding_url ?? '',
          studentName,
        },
      });
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-4 pt-12">
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          ← Back
        </Button>
        <View className="mt-4">
          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="First name"
                placeholder="Required"
                value={value}
                onChangeText={onChange}
                error={errors.first_name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="last_name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Last name (optional)"
                placeholder=""
                value={value ?? ''}
                onChangeText={onChange}
                containerClassName="mt-4"
              />
            )}
          />
          <Controller
            control={control}
            name="date_of_birth"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date of birth (optional)"
                placeholder="YYYY-MM-DD"
                value={value ?? ''}
                onChangeText={onChange}
                containerClassName="mt-4"
              />
            )}
          />
          <Controller
            control={control}
            name="blood_group"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Blood group (optional)"
                placeholder="e.g. O+"
                value={value ?? ''}
                onChangeText={onChange}
                containerClassName="mt-4"
              />
            )}
          />
          <Controller
            control={control}
            name="parent_phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Parent phone (optional)"
                placeholder="10-digit number"
                value={value ?? ''}
                onChangeText={onChange}
                error={errors.parent_phone?.message}
                containerClassName="mt-4"
              />
            )}
          />
        </View>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="mt-8"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        >
          Add student
        </Button>
      </View>
    </ScrollView>
  );
}

async function getFirstBranchId(orgId: string): Promise<string | null> {
  const { data } = await supabase.from('branches').select('id').eq('org_id', orgId).limit(1).single();
  return data?.id ?? null;
}
