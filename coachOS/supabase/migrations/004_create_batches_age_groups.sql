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
