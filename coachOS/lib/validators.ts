import { z } from 'zod';

const indianPhoneRegex = /^[6-9]\d{9}$/;

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => indianPhoneRegex.test(val), {
    message: 'Enter a valid 10-digit Indian phone number',
  });

const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((val) => (val ? val.replace(/\D/g, '') : undefined))
  .refine((val) => !val || indianPhoneRegex.test(val), {
    message: 'Enter a valid 10-digit Indian phone number',
  });

export const orgDetailsSchema = z.object({
  name: z.string().min(2, 'Academy name must be at least 2 characters').max(100),
  sport_type: z.string().min(1, 'Select a sport type'),
});

export const foundersSchema = z.object({
  has_cofounders: z.boolean(),
  cofounder_emails: z.array(z.string().email('Enter a valid email')).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: optionalPhoneSchema,
});

export const branchesFormSchema = z.object({
  branches: z.array(branchSchema).min(1, 'At least one branch is required'),
});

export const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required').max(50),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  days_of_week: z.array(z.string()).min(1, 'Select at least one day'),
  branch_ids: z.array(z.string()),
});

export const batchesFormSchema = z.object({
  batches: z.array(batchSchema).min(1, 'At least one batch is required'),
});

export const ageGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(20),
  min_age: z.number().min(0).max(99),
  max_age: z.number().min(0).max(99),
  gender: z.enum(['male', 'female', 'all']).default('all'),
});

export const ageGroupsFormSchema = z.object({
  age_groups: z
    .array(ageGroupSchema)
    .min(1, 'At least one age group is required'),
});

export const createStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().max(50).optional(),
  date_of_birth: z.string().optional(),
  blood_group: z.string().optional(),
  parent_phone: optionalPhoneSchema,
});

export const parentOnboardingSchema = z.object({
  parent_name: z.string().min(1, 'Parent name is required').max(100),
  parent_relationship: z.enum(['father', 'mother', 'guardian', 'other']),
  parent_phone: phoneSchema,
  guardian_name: z.string().max(100).optional(),
  guardian_phone: optionalPhoneSchema,
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  school_name: z.string().min(1, 'School name is required').max(100),
  school_grade: z.string().min(1, 'Grade/class is required').max(20),
  gender: z.enum(['male', 'female', 'other']),
  health_notes: z.string().max(500).optional(),
  special_needs: z.string().max(500).optional(),
  uniform_size: z.string().min(1, 'Select a size'),
  uniform_gender: z.enum(['boy', 'girl', 'unisex']),
});

export const createPaymentSchema = z.object({
  student_id: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  period_label: z.string().min(1, 'Period is required'),
  due_date: z.string().optional(),
});

export const markPaymentSchema = z.object({
  payment_method: z.enum(['cash', 'upi', 'bank_transfer']),
  amount: z.number().positive(),
  notes: z.string().max(200).optional(),
});

export const coachNoteSchema = z.object({
  student_id: z.string().uuid(),
  note_type: z.enum(['diet', 'practice', 'improvement', 'general']),
  title: z.string().max(100).optional(),
  body: z.string().min(1, 'Note content is required').max(2000),
});

export const createMatchSchema = z.object({
  title: z.string().min(1, 'Match title is required').max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  match_date: z.string().min(1, 'Match date is required'),
  match_type: z.string().optional(),
  preparation_notes: z.string().max(2000).optional(),
  participant_ids: z.array(z.string().uuid()).optional(),
});

export const broadcastSchema = z.object({
  template_name: z.string().min(1, 'Select a message template'),
  recipient_type: z.enum(['all_parents', 'batch', 'unpaid', 'specific']),
  batch_id: z.string().uuid().optional(),
  student_ids: z.array(z.string().uuid()).optional(),
  custom_message: z.string().max(1000).optional(),
});

export const createInviteSchema = z.object({
  role: z.enum(['branch_admin', 'coach', 'temp_coach']),
  branch_id: z.string().uuid(),
  max_uses: z.number().int().positive().max(10).optional(),
  expiry_hours: z.number().int().positive().max(720).optional(),
});

export const studentLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
