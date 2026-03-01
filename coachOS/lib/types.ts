export interface Organization {
  id: string;
  name: string;
  sport_type: string;
  slug: string;
  logo_url: string | null;
  payment_model: 'pay_first' | 'attend_first';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  auth_user_id: string;
  org_id: string;
  branch_id: string | null;
  role: 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach';
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  access_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgeGroup {
  id: string;
  org_id: string;
  name: string;
  min_age: number | null;
  max_age: number | null;
  gender: 'male' | 'female' | 'all';
  sort_order: number;
  created_at: string;
}

export interface Batch {
  id: string;
  org_id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[];
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  org_id: string;
  branch_id: string;
  student_id_code: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  blood_group: string | null;
  gender: 'male' | 'female' | 'other' | null;
  school_name: string | null;
  school_grade: string | null;
  address: string | null;
  city: string | null;
  parent_phone: string | null;
  parent_name: string | null;
  guardian_phone: string | null;
  guardian_name: string | null;
  age_group_id: string | null;
  batch_id: string | null;
  uniform_size: string | null;
  uniform_gender: 'boy' | 'girl' | 'unisex' | null;
  health_notes: string | null;
  special_needs: string | null;
  profile_status: 'incomplete' | 'complete';
  enrollment_status: 'active' | 'paused' | 'archived';
  fee_status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  username: string | null;
  parent_onboarding_token: string | null;
  parent_onboarding_completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  age_group?: AgeGroup | null;
  batch?: Batch | null;
}

export interface AttendanceRecord {
  id: string;
  org_id: string;
  branch_id: string;
  batch_id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  marked_by_staff?: StaffProfile;
}

export interface Payment {
  id: string;
  org_id: string;
  branch_id: string;
  student_id: string;
  amount: number;
  currency: string;
  period_label: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  razorpay_payment_link_id: string | null;
  invoice_url: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded' | 'waived';
  marked_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export interface Invite {
  id: string;
  org_id: string;
  branch_id: string | null;
  token: string;
  role: 'super_admin' | 'branch_admin' | 'coach' | 'temp_coach';
  created_by: string;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string;
  branch_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface WhatsAppLog {
  id: string;
  org_id: string;
  branch_id: string | null;
  sent_by: string | null;
  recipient_phone: string;
  recipient_name: string | null;
  template_name: string | null;
  message_type: string;
  message_body: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  whatsapp_message_id: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  org_id: string;
  branch_id: string;
  title: string;
  description: string | null;
  location: string | null;
  match_date: string;
  match_type: string | null;
  preparation_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: Student[];
}

export interface NewsPost {
  id: string;
  org_id: string;
  branch_id: string | null;
  title: string;
  body: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
}

export interface CoachNote {
  id: string;
  org_id: string;
  student_id: string;
  coach_id: string;
  note_type: 'diet' | 'practice' | 'improvement' | 'general';
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  coach?: StaffProfile;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  org_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface StudentFilters {
  search?: string;
  batchId?: string;
  ageGroupId?: string;
  feeStatus?: string;
  profileStatus?: string;
  enrollmentStatus?: string;
}

export interface AttendanceFilters {
  dateFrom?: string;
  dateTo?: string;
  batchId?: string;
  status?: string;
  studentId?: string;
}

export interface PaymentFilters {
  status?: string;
  batchId?: string;
  search?: string;
  month?: string;
}

export interface CreateStudentForm {
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  blood_group?: string;
  parent_phone?: string;
}

export interface ParentOnboardingForm {
  parent_name: string;
  parent_relationship: 'father' | 'mother' | 'guardian' | 'other';
  parent_phone: string;
  guardian_name?: string;
  guardian_phone?: string;
  address: string;
  city: string;
  school_name: string;
  school_grade: string;
  gender: 'male' | 'female' | 'other';
  health_notes?: string;
  special_needs?: string;
  uniform_size: string;
  uniform_gender: 'boy' | 'girl' | 'unisex';
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email?: string;
    role: StaffProfile['role'] | 'student';
    orgId: string;
    branchId: string | null;
    profile: StaffProfile | Student | null;
  } | null;
}
