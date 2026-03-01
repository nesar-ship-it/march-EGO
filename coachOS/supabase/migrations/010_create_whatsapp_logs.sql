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
