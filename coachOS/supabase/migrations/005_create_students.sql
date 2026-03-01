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
