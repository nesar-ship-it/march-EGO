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
