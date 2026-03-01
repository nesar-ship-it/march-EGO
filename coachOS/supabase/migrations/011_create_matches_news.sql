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
