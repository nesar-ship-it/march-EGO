import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Card } from '@/components/ui';
import { validateParentOnboardingToken, completeParentOnboarding } from '@/services/parent-onboarding';
import { parentOnboardingSchema } from '@/lib/validators';
import type { ParentOnboardingForm } from '@/lib/types';

const step1Schema = z.object({
  parent_name: z.string().min(1, 'Parent name is required').max(100),
  parent_phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit phone'),
  guardian_name: z.string().max(100).optional(),
  guardian_phone: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, '') : undefined))
    .refine((v) => !v || /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit phone'),
});

const step2Schema = z.object({
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  school_name: z.string().min(1, 'School name is required').max(100),
  school_grade: z.string().min(1, 'Grade/class is required').max(20),
  gender: z.enum(['male', 'female', 'other']),
});

const step3Schema = z.object({
  health_notes: z.string().max(500).optional(),
  special_needs: z.string().max(500).optional(),
  uniform_size: z.string().min(1, 'Select a size'),
  uniform_gender: z.enum(['boy', 'girl', 'unisex']),
});

export default function ParentOnboardingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'completed'>('loading');
  const [student, setStudent] = useState<{
    first_name: string;
    last_name: string | null;
    parent_phone: string | null;
  } | null>(null);
  const [step, setStep] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const DRAFT_KEY = (t: string) => `parent-onboarding-draft-${t}`;

  const form = useForm<ParentOnboardingForm>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues: {
      parent_name: '',
      parent_relationship: 'father',
      parent_phone: '',
      guardian_name: '',
      guardian_phone: '',
      address: '',
      city: '',
      school_name: '',
      school_grade: '',
      gender: 'male',
      health_notes: '',
      special_needs: '',
      uniform_size: '',
      uniform_gender: 'boy',
    },
  });

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setStatus('invalid');
      return;
    }
    validateParentOnboardingToken(token).then(({ valid, student: s }) => {
      if (valid && s) {
        setStudent(s);
        if (typeof localStorage !== 'undefined') {
          try {
            const raw = localStorage.getItem(DRAFT_KEY(token));
            if (raw) {
              const draft = JSON.parse(raw) as Partial<ParentOnboardingForm>;
              form.reset({
                parent_name: draft.parent_name ?? '',
                parent_relationship: draft.parent_relationship ?? 'father',
                parent_phone: draft.parent_phone ?? s.parent_phone ?? '',
                guardian_name: draft.guardian_name ?? '',
                guardian_phone: draft.guardian_phone ?? '',
                address: draft.address ?? '',
                city: draft.city ?? '',
                school_name: draft.school_name ?? '',
                school_grade: draft.school_grade ?? '',
                gender: draft.gender ?? 'male',
                health_notes: draft.health_notes ?? '',
                special_needs: draft.special_needs ?? '',
                uniform_size: draft.uniform_size ?? '',
                uniform_gender: draft.uniform_gender ?? 'boy',
              });
            } else {
              form.reset({
                ...form.getValues(),
                parent_name: '',
                parent_relationship: 'father',
                parent_phone: s.parent_phone ?? '',
              });
            }
          } catch {
            form.reset({
              ...form.getValues(),
              parent_name: '',
              parent_relationship: 'father',
              parent_phone: s.parent_phone ?? '',
            });
          }
        } else {
          form.reset({
            ...form.getValues(),
            parent_name: '',
            parent_relationship: 'father',
            parent_phone: s.parent_phone ?? '',
          });
        }
        setStatus(s.parent_onboarding_completed_at ? 'completed' : 'valid');
      } else {
        setStatus('invalid');
      }
    }).catch(() => setStatus('invalid'));
  }, [token]);

  useEffect(() => {
    if (status !== 'valid' || !token || typeof localStorage === 'undefined') return;
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(DRAFT_KEY(token), JSON.stringify(values));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [status, token, form.watch]);

  const handleNext = async () => {
    if (step === 1) {
      const ok = await form.trigger(['parent_name', 'parent_relationship', 'parent_phone', 'guardian_name', 'guardian_phone']);
      if (ok) setStep(2);
    } else if (step === 2) {
      const ok = await form.trigger(['address', 'city', 'school_name', 'school_grade', 'gender']);
      if (ok) setStep(3);
    } else if (step === 3) {
      const ok = await form.trigger(['health_notes', 'special_needs', 'uniform_size', 'uniform_gender']);
      if (ok) {
        setSubmitLoading(true);
        const values = form.getValues();
        const { error } = await completeParentOnboarding(token!, values);
        setSubmitLoading(false);
        if (!error) {
          if (typeof localStorage !== 'undefined' && token) {
            try {
              localStorage.removeItem(DRAFT_KEY(token));
            } catch {}
          }
          setSubmitted(true);
        }
      }
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="font-inter-regular text-body-md text-text-secondary">
          Loading...
        </Text>
      </View>
    );
  }

  if (status === 'invalid') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-center font-inter-semibold text-h3 text-text-primary">
          Invalid or expired link
        </Text>
        <Text className="mt-2 text-center font-inter-regular text-body-md text-text-secondary">
          This link is invalid or has expired.
        </Text>
      </View>
    );
  }

  if (status === 'completed' && !submitted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-center font-inter-semibold text-h3 text-text-primary">
          Profile already complete
        </Text>
        <Text className="mt-2 text-center font-inter-regular text-body-md text-text-secondary">
          {student?.first_name}'s profile has been completed. You can update details if needed.
        </Text>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onPress={() => setStatus('valid')}
        >
          Update Details
        </Button>
      </View>
    );
  }

  if (submitted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-center font-inter-semibold text-h3 text-text-primary">
          Thank you!
        </Text>
        <Text className="mt-2 text-center font-inter-regular text-body-md text-text-secondary">
          {student?.first_name}'s profile is now complete.
        </Text>
      </View>
    );
  }

  const contentWrapStyle = Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center' as const, width: '100%' } : undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <View style={contentWrapStyle} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-inter-semibold text-h2 text-text-primary">
          Complete profile
        </Text>
        <Text className="mt-1 font-inter-regular text-body-md text-text-secondary">
          Step {step} of 3
        </Text>

        {step === 1 && (
          <View className="mt-6 gap-4">
            <Controller
              control={form.control}
              name="parent_name"
              render={({ field, fieldState }) => (
                <Input
                  label="Parent/Guardian Name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="Full name"
                  autoCapitalize="words"
                />
              )}
            />
            <Controller
              control={form.control}
              name="parent_relationship"
              render={({ field, fieldState }) => (
                <View>
                  <Text className="mb-2 font-inter-medium text-label-sm text-text-secondary">
                    Relationship
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { value: 'father' as const, label: 'Father' },
                      { value: 'mother' as const, label: 'Mother' },
                      { value: 'guardian' as const, label: 'Guardian' },
                      { value: 'other' as const, label: 'Other' },
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={field.value === value ? 'primary' : 'secondary'}
                        size="sm"
                        onPress={() => field.onChange(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </View>
                  {fieldState.error?.message ? (
                    <Text className="mt-1 font-inter-regular text-caption text-status-error">
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="parent_phone"
              render={({ field, fieldState }) => (
                <Input
                  label="Phone number"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="10-digit mobile"
                  keyboardType="phone-pad"
                />
              )}
            />
            <Controller
              control={form.control}
              name="guardian_name"
              render={({ field }) => (
                <Input
                  label="Additional Guardian Name (optional)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="Driver, family member"
                  autoCapitalize="words"
                />
              )}
            />
            <Controller
              control={form.control}
              name="guardian_phone"
              render={({ field, fieldState }) => (
                <Input
                  label="Additional Guardian Phone (optional)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="Emergency contact"
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>
        )}

        {step === 2 && (
          <View className="mt-6 gap-4">
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <View>
                  <Text className="mb-2 font-inter-medium text-label-sm text-text-secondary">
                    Gender
                  </Text>
                  <View className="flex-row gap-4">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <Button
                        key={g}
                        variant={field.value === g ? 'primary' : 'secondary'}
                        size="sm"
                        onPress={() => field.onChange(g)}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Button>
                    ))}
                  </View>
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Input
                  label="Address"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="Full address"
                  multiline
                />
              )}
            />
            <Controller
              control={form.control}
              name="city"
              render={({ field, fieldState }) => (
                <Input
                  label="City"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="City"
                />
              )}
            />
            <Controller
              control={form.control}
              name="school_name"
              render={({ field, fieldState }) => (
                <Input
                  label="School Name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="School name"
                />
              )}
            />
            <Controller
              control={form.control}
              name="school_grade"
              render={({ field, fieldState }) => (
                <Input
                  label="Grade/Class"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="e.g. 8th, 10th"
                />
              )}
            />
          </View>
        )}

        {step === 3 && (
          <View className="mt-6 gap-4">
            <Controller
              control={form.control}
              name="health_notes"
              render={({ field }) => (
                <Input
                  label="Health Notes (optional)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="Medical conditions, allergies"
                  multiline
                />
              )}
            />
            <Controller
              control={form.control}
              name="special_needs"
              render={({ field }) => (
                <Input
                  label="Special Needs (optional)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  placeholder="Accommodations needed"
                  multiline
                />
              )}
            />
            <Controller
              control={form.control}
              name="uniform_size"
              render={({ field, fieldState }) => (
                <Select
                  label="Uniform T-shirt Size"
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Select size"
                  options={[
                    { value: 'XS', label: 'XS' },
                    { value: 'S', label: 'S' },
                    { value: 'M', label: 'M' },
                    { value: 'L', label: 'L' },
                    { value: 'XL', label: 'XL' },
                    { value: 'XXL', label: 'XXL' },
                  ]}
                />
              )}
            />
            <Controller
              control={form.control}
              name="uniform_gender"
              render={({ field }) => (
                <View>
                  <Text className="mb-2 font-inter-medium text-label-sm text-text-secondary">
                    Uniform Gender
                  </Text>
                  <View className="flex-row gap-4">
                    {(['boy', 'girl', 'unisex'] as const).map((g) => (
                      <Button
                        key={g}
                        variant={field.value === g ? 'primary' : 'secondary'}
                        size="sm"
                        onPress={() => field.onChange(g)}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Button>
                    ))}
                  </View>
                </View>
              )}
            />
          </View>
        )}

        <View className="mt-8 flex-row gap-3">
          {step > 1 ? (
            <Button variant="secondary" size="lg" onPress={handleBack} className="flex-1">
              Back
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="lg"
            onPress={handleNext}
            loading={submitLoading}
            className={step > 1 ? 'flex-1' : 'flex-1'}
          >
            {step === 3 ? 'Submit' : 'Continue'}
          </Button>
        </View>
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
