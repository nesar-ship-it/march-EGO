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
