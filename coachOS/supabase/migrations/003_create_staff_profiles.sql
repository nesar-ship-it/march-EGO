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
