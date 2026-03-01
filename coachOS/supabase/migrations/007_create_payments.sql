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
