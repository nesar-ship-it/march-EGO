-- WhatsApp message logs
CREATE TABLE whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  template_name TEXT,
  message_type TEXT NOT NULL,
  message_body TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  whatsapp_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_logs_org_created ON whatsapp_logs (org_id, created_at DESC);
CREATE INDEX idx_whatsapp_logs_recipient_created ON whatsapp_logs (recipient_phone, created_at DESC);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_logs (status);
