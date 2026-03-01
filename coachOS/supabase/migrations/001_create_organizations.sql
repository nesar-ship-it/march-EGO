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
