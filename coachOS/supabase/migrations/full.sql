-- ==========================================
-- File: 001_create_organizations.sql
-- ==========================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL DEFAULT 'cricket',
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    payment_model TEXT NOT NULL DEFAULT 'pay_first',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: The updated_at trigger will be created in a later migration file (014)
-- to ensure it can be reused across all tables.


-- ==========================================
-- File: 002_create_branches.sql
-- ==========================================

-- Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS branches_org_id_idx ON public.branches(org_id);


-- ==========================================
-- File: 003_create_staff_profiles.sql
-- ==========================================

-- Create staff_profiles table
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    access_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(auth_user_id, org_id)
);

CREATE INDEX IF NOT EXISTS staff_profiles_auth_user_id_idx ON public.staff_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS staff_profiles_org_id_idx ON public.staff_profiles(org_id);
CREATE INDEX IF NOT EXISTS staff_profiles_org_branch_idx ON public.staff_profiles(org_id, branch_id);


-- ==========================================
-- File: 004_create_batches_age_groups.sql
-- ==========================================

-- Create batches table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TIME,
    end_time TIME,
    days_of_week TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS batches_org_id_idx ON public.batches(org_id);

-- Create branch_batches junction table
CREATE TABLE IF NOT EXISTS public.branch_batches (
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    PRIMARY KEY (branch_id, batch_id)
);

-- Create age_groups table
CREATE TABLE IF NOT EXISTS public.age_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'all')) DEFAULT 'all',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, name)
);


-- ==========================================
-- File: 005_create_students.sql
-- ==========================================

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    student_id_code TEXT NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT,
    date_of_birth DATE,
    age INTEGER,
    blood_group TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    school_name TEXT,
    school_grade TEXT,
    address TEXT,
    city TEXT,
    parent_phone TEXT,
    parent_name TEXT,
    guardian_phone TEXT,
    guardian_name TEXT,
    age_group_id UUID REFERENCES public.age_groups(id),
    batch_id UUID REFERENCES public.batches(id),
    uniform_size TEXT,
    uniform_gender TEXT CHECK (uniform_gender IN ('boy', 'girl', 'unisex')),
    health_notes TEXT,
    special_needs TEXT,
    profile_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (profile_status IN ('incomplete', 'complete')),
    enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('active', 'paused', 'archived')),
    fee_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (fee_status IN ('paid', 'unpaid', 'overdue', 'partial')),
    username TEXT UNIQUE,
    parent_onboarding_token TEXT UNIQUE,
    parent_onboarding_completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.staff_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, student_id_code)
);

CREATE INDEX IF NOT EXISTS students_org_id_idx ON public.students(org_id);
CREATE INDEX IF NOT EXISTS students_branch_id_idx ON public.students(branch_id);
CREATE INDEX IF NOT EXISTS students_batch_id_idx ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS students_active_idx ON public.students(org_id, enrollment_status);
CREATE INDEX IF NOT EXISTS students_auth_idx ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS students_token_idx ON public.students(parent_onboarding_token);


-- ==========================================
-- File: 006_create_attendance.sql
-- ==========================================

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    batch_id UUID NOT NULL REFERENCES public.batches(id),
    student_id UUID NOT NULL REFERENCES public.students(id),
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID NOT NULL REFERENCES public.staff_profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, batch_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_branch_date_idx ON public.attendance_records(branch_id, date);
CREATE INDEX IF NOT EXISTS attendance_batch_date_idx ON public.attendance_records(batch_id, date);
CREATE INDEX IF NOT EXISTS attendance_student_date_idx ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS attendance_org_date_idx ON public.attendance_records(org_id, date);


-- ==========================================
-- File: 007_create_payments.sql
-- ==========================================

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    student_id UUID NOT NULL REFERENCES public.students(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    period_label TEXT NOT NULL,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    razorpay_payment_id TEXT,
    razorpay_payment_link_id TEXT,
    invoice_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'refunded', 'waived')),
    marked_by UUID REFERENCES public.staff_profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_branch_status_idx ON public.payments(branch_id, status);
CREATE INDEX IF NOT EXISTS payments_student_status_idx ON public.payments(student_id, status);
CREATE INDEX IF NOT EXISTS payments_razorpay_link_idx ON public.payments(razorpay_payment_link_id);
CREATE INDEX IF NOT EXISTS payments_org_due_date_idx ON public.payments(org_id, due_date);


-- ==========================================
-- File: 008_create_invites.sql
-- ==========================================

-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID REFERENCES public.branches(id),
    token TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')),
    created_by UUID NOT NULL REFERENCES public.staff_profiles(id),
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    temp_coach_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invites_token_idx ON public.invites(token);


-- ==========================================
-- File: 009_create_audit_logs.sql
-- ==========================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID REFERENCES public.branches(id),
    actor_id UUID,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON public.audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at);


-- ==========================================
-- File: 010_create_whatsapp_logs.sql
-- ==========================================

-- Create whatsapp_logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID REFERENCES public.branches(id),
    sent_by UUID REFERENCES public.staff_profiles(id),
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    template_name TEXT,
    message_type TEXT NOT NULL,
    message_body TEXT,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    whatsapp_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_logs_org_created_idx ON public.whatsapp_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_logs_recipient_idx ON public.whatsapp_logs(recipient_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_logs_status_idx ON public.whatsapp_logs(status);


-- ==========================================
-- File: 011_create_matches_news.sql
-- ==========================================

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    match_date TIMESTAMPTZ NOT NULL,
    match_type TEXT,
    preparation_notes TEXT,
    created_by UUID NOT NULL REFERENCES public.staff_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create match_participants table
CREATE TABLE IF NOT EXISTS public.match_participants (
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    notes TEXT,
    PRIMARY KEY (match_id, student_id)
);

-- Create news_posts table
CREATE TABLE IF NOT EXISTS public.news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    branch_id UUID REFERENCES public.branches(id),
    title TEXT NOT NULL,
    body TEXT,
    image_url TEXT,
    created_by UUID NOT NULL REFERENCES public.staff_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create news_reactions table
CREATE TABLE IF NOT EXISTS public.news_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_post_id UUID REFERENCES public.news_posts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('👍', '🔥', '💪', '❤️')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(news_post_id, student_id)
);


-- ==========================================
-- File: 012_create_coach_notes_documents.sql
-- ==========================================

-- Create coach_notes table
CREATE TABLE IF NOT EXISTS public.coach_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.staff_profiles(id),
    note_type TEXT NOT NULL CHECK (note_type IN ('diet', 'practice', 'improvement', 'general')),
    title TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create student_documents table
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    document_type TEXT NOT NULL CHECK (document_type IN ('birth_certificate', 'school_id', 'medical_certificate', 'photo', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- File: 013_helper_functions.sql
-- ==========================================

-- Helper functions for RLS (014) and Edge Functions. Must run before 014_rls_policies.

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(org_id), '{}')::UUID[]
  FROM staff_profiles
  WHERE auth_user_id = auth.uid() AND is_active = true
    AND (access_expires_at IS NULL OR access_expires_at > now());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_branch_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(DISTINCT bid), '{}')::UUID[]
  FROM (
    SELECT CASE WHEN sp.branch_id IS NOT NULL THEN sp.branch_id ELSE b.id END AS bid
    FROM staff_profiles sp
    LEFT JOIN branches b ON b.org_id = sp.org_id AND b.is_active = true
    WHERE sp.auth_user_id = auth.uid() AND sp.is_active = true
      AND (sp.access_expires_at IS NULL OR sp.access_expires_at > now())
  ) x
  WHERE bid IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM staff_profiles
  WHERE auth_user_id = auth.uid() AND org_id = p_org_id AND is_active = true
    AND (access_expires_at IS NULL OR access_expires_at > now())
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM students WHERE auth_user_id = auth.uid() AND enrollment_status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_student_id_code(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  i INT := 0;
BEGIN
  LOOP
    code := lpad(floor(random() * 10000)::int::text, 4, '0');
    IF code = '0000' THEN code := '0001'; END IF;
    IF NOT EXISTS (SELECT 1 FROM students WHERE org_id = p_org_id AND student_id_code = code) THEN
      RETURN code;
    END IF;
    i := i + 1;
    IF i >= 10 THEN
      code := lpad(floor(random() * 100000)::int::text, 5, '0');
      IF NOT EXISTS (SELECT 1 FROM students WHERE org_id = p_org_id AND student_id_code = code) THEN
        RETURN code;
      END IF;
    END IF;
    EXIT WHEN i >= 20;
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_audit(
  p_org_id UUID,
  p_branch_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
  INSERT INTO audit_logs (org_id, branch_id, actor_id, actor_role, action, entity_type, entity_id, details)
  VALUES (p_org_id, p_branch_id, p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id, p_details);
$$ LANGUAGE sql SECURITY DEFINER;


-- ==========================================
-- File: 013_rls_policies.sql
-- ==========================================

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;


-- RLS for Organizations
CREATE POLICY "Staff can view their organizations" ON public.organizations
    FOR SELECT USING (id = ANY(public.get_user_org_ids()));
CREATE POLICY "Super Admins can update their organizations" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles 
            WHERE org_id = organizations.id AND role = 'super_admin' AND auth_user_id = auth.uid() AND is_active = true
        )
    );

-- RLS for Staff Profiles
CREATE POLICY "Staff can view staff in their orgs" ON public.staff_profiles
    FOR SELECT USING (org_id = ANY(public.get_user_org_ids()));
CREATE POLICY "Super Admins can insert/update staff in their org" ON public.staff_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles sp 
            WHERE sp.org_id = staff_profiles.org_id AND sp.role = 'super_admin' AND sp.auth_user_id = auth.uid() AND sp.is_active = true
        )
    );
CREATE POLICY "Users can update their own profile" ON public.staff_profiles
    FOR UPDATE USING (auth_user_id = auth.uid());

-- RLS for Students
CREATE POLICY "Staff can view students in their branch" ON public.students
    FOR SELECT USING (branch_id = ANY(public.get_user_branch_ids()));
CREATE POLICY "Super Admins can view all students in org" ON public.students
    FOR SELECT USING (org_id = ANY(public.get_user_org_ids()));    
CREATE POLICY "Students can view themselves" ON public.students
    FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Staff can insert/update students in their branch" ON public.students
    FOR ALL USING (branch_id = ANY(public.get_user_branch_ids()));
CREATE POLICY "Super Admins can insert/update/delete all students in org" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles 
            WHERE org_id = students.org_id AND role = 'super_admin' AND auth_user_id = auth.uid() AND is_active = true
        )
    );

-- RLS for Attendance Records
CREATE POLICY "Staff can view attendance in their branch" ON public.attendance_records
    FOR SELECT USING (branch_id = ANY(public.get_user_branch_ids()));
CREATE POLICY "Super Admins can view all attendance in org" ON public.attendance_records
    FOR SELECT USING (org_id = ANY(public.get_user_org_ids()));
CREATE POLICY "Students can view their own attendance" ON public.attendance_records
    FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
CREATE POLICY "Staff can insert attendance in their branch" ON public.attendance_records
    FOR INSERT WITH CHECK (branch_id = ANY(public.get_user_branch_ids()));
CREATE POLICY "Super/Branch Admins can update attendance" ON public.attendance_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles 
            WHERE org_id = attendance_records.org_id AND role IN ('super_admin', 'branch_admin') AND auth_user_id = auth.uid() AND is_active = true
        )
    );

-- RLS for Payments
CREATE POLICY "Staff can view payments in their branch" ON public.payments
    FOR SELECT USING (branch_id = ANY(public.get_user_branch_ids()));
CREATE POLICY "Super Admins can view all payments in org" ON public.payments
    FOR SELECT USING (org_id = ANY(public.get_user_org_ids()));
CREATE POLICY "Students can view their own payments" ON public.payments
    FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));
CREATE POLICY "Super/Branch Admins can insert/update payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.staff_profiles 
            WHERE org_id = payments.org_id AND role IN ('super_admin', 'branch_admin') AND auth_user_id = auth.uid() AND is_active = true
        )
    );

-- Note: Other tables (batches, branches, matches, etc) follow the exact same pattern:
-- "Branch Staff can view/insert in their branch"
-- "Super Admin can view/insert/delete everything in org"
-- "Students can read their own or branch wide reading info"
-- Implementing these is standard across the entire schema using the helper functions above.


-- ==========================================
-- File: 014_helper_functions.sql
-- ==========================================

-- Helper function to generate unique student ID codes
CREATE OR REPLACE FUNCTION public.generate_student_id_code(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate 4 digit code first, try up to 10 times
        IF attempts < 10 THEN
            new_code := lpad((floor(random() * 10000))::text, 4, '0');
        ELSE
            -- Generate 5 digit code as fallback
            new_code := lpad((floor(random() * 100000))::text, 5, '0');
        END IF;
        
        -- Check if it exists for this org
        SELECT EXISTS (
            SELECT 1 FROM public.students 
            WHERE org_id = p_org_id AND student_id_code = new_code
        ) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
        attempts := attempts + 1;
        
        IF attempts > 20 THEN
            RAISE EXCEPTION 'Could not generate unique student ID code after 20 attempts';
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Helper function to recalculate student fee status based on payment records
CREATE OR REPLACE FUNCTION public.recalculate_student_fee_status(target_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    new_status TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM public.payments WHERE student_id = target_student_id AND status = 'overdue') THEN
        new_status := 'overdue';
    ELSIF EXISTS (SELECT 1 FROM public.payments WHERE student_id = target_student_id AND status = 'pending') THEN
        new_status := 'unpaid';
    ELSIF EXISTS (SELECT 1 FROM public.payments WHERE student_id = target_student_id AND status = 'partial') THEN
        new_status := 'partial';
    ELSE
        new_status := 'paid';
    END IF;

    UPDATE public.students 
    SET fee_status = new_status 
    WHERE id = target_student_id;
END;
$$;

-- Helper trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the triggers on necessary tables
CREATE TRIGGER update_organizations_modtime BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_profiles_modtime BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_records_modtime BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_modtime BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coach_notes_modtime BEFORE UPDATE ON public.coach_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- File: 014_rls_policies.sql
-- ==========================================

-- RLS policies (depend on 013_helper_functions)

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select ON organizations FOR SELECT USING (
  id = ANY(get_user_org_ids())
  OR (is_student() AND id IN (SELECT org_id FROM students WHERE auth_user_id = auth.uid()))
);

CREATE POLICY branches_select ON branches FOR SELECT USING (
  id = ANY(get_user_branch_ids())
  OR (is_student() AND org_id IN (SELECT org_id FROM students WHERE auth_user_id = auth.uid()))
);

CREATE POLICY staff_select ON staff_profiles FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY staff_insert ON staff_profiles FOR INSERT WITH CHECK (auth_user_id = auth.uid());
CREATE POLICY staff_update ON staff_profiles FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY students_select ON students FOR SELECT USING (
  (auth_user_id = auth.uid())
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);
CREATE POLICY students_update ON students FOR UPDATE USING (
  auth_user_id = auth.uid()
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);

CREATE POLICY batches_select ON batches FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY batches_all ON batches FOR ALL USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY branch_batches_select ON branch_batches FOR SELECT USING (branch_id = ANY(get_user_branch_ids()));
CREATE POLICY branch_batches_all ON branch_batches FOR ALL USING (branch_id = ANY(get_user_branch_ids()));

CREATE POLICY age_groups_select ON age_groups FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY age_groups_all ON age_groups FOR ALL USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY attendance_select ON attendance_records FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY attendance_insert ON attendance_records FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);
CREATE POLICY attendance_update ON attendance_records FOR UPDATE USING (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);

CREATE POLICY payments_select ON payments FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY payments_insert ON payments FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);
CREATE POLICY payments_update ON payments FOR UPDATE USING (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);

CREATE POLICY invites_select ON invites FOR SELECT USING (
  created_by IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid())
  OR (org_id = ANY(get_user_org_ids()) AND get_user_role(org_id) = 'super_admin')
);
CREATE POLICY invites_insert ON invites FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND created_by IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY invites_update ON invites FOR UPDATE USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY audit_select ON audit_logs FOR SELECT USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY whatsapp_select ON whatsapp_logs FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY whatsapp_insert ON whatsapp_logs FOR INSERT WITH CHECK (org_id = ANY(get_user_org_ids()));

CREATE POLICY matches_select ON matches FOR SELECT USING (
  (id IN (SELECT match_id FROM match_participants WHERE student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())))
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY matches_all ON matches FOR ALL USING (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);

CREATE POLICY match_participants_select ON match_participants FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  OR match_id IN (SELECT id FROM matches WHERE org_id = ANY(get_user_org_ids()))
);
CREATE POLICY match_participants_all ON match_participants FOR ALL USING (
  match_id IN (SELECT id FROM matches WHERE org_id = ANY(get_user_org_ids()))
);

CREATE POLICY news_posts_select ON news_posts FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY news_posts_all ON news_posts FOR ALL USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY news_reactions_select ON news_reactions FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  OR news_post_id IN (SELECT id FROM news_posts WHERE org_id = ANY(get_user_org_ids()))
);
CREATE POLICY news_reactions_insert ON news_reactions FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
);

CREATE POLICY coach_notes_select ON coach_notes FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()) AND (get_user_role(org_id) IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')))
);
CREATE POLICY coach_notes_insert ON coach_notes FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND coach_id IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY coach_notes_update ON coach_notes FOR UPDATE USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY student_documents_select ON student_documents FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()))
);
CREATE POLICY student_documents_insert ON student_documents FOR INSERT WITH CHECK (org_id = ANY(get_user_org_ids()));


-- ==========================================
-- File: 015_cron_jobs.sql
-- ==========================================

-- These instructions are meant to be configured if pg_cron is enabled on the Supabase database.

-- Ensure pg_cron extension is enabled first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Update overdue payments
-- Schedule: Daily at midnight IST (18:30 UTC previous day)
-- SELECT cron.schedule('update_overdue_payments', '30 18 * * *', $$
--     UPDATE public.payments 
--     SET status = 'overdue' 
--     WHERE status = 'pending' AND due_date < CURRENT_DATE;
-- $$);

-- Job 2: Expire temp coaches
-- Schedule: Every hour
-- SELECT cron.schedule('expire_temp_coaches', '0 * * * *', $$
--     UPDATE public.staff_profiles 
--     SET is_active = false 
--     WHERE role = 'temp_coach' AND access_expires_at < now() AND is_active = true;
-- $$);

-- Job 3: Cleanup old audit logs
-- Schedule: Weekly (Sunday 3 AM IST)
-- SELECT cron.schedule('cleanup_audit_logs', '30 21 * * 6', $$
--     DELETE FROM public.audit_logs 
--     WHERE created_at < now() - interval '365 days';
-- $$);

-- Job 4: Cleanup expired invites
-- Schedule: Daily at 2 AM IST
-- SELECT cron.schedule('cleanup_expired_invites', '30 20 * * *', $$
--     UPDATE public.invites 
--     SET is_active = false 
--     WHERE expires_at < now() AND is_active = true;
-- $$);


-- ==========================================
-- File: 017_students_parent_relationship.sql
-- ==========================================

-- Add parent relationship for parent onboarding form
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_relationship TEXT CHECK (parent_relationship IN ('father', 'mother', 'guardian', 'other'));


