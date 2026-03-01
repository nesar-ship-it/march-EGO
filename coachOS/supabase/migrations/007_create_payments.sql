-- Payments (fees per student)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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
  marked_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_branch_status ON payments (branch_id, status);
CREATE INDEX idx_payments_student_status ON payments (student_id, status);
CREATE INDEX idx_payments_razorpay_link ON payments (razorpay_payment_link_id);
CREATE INDEX idx_payments_org_due ON payments (org_id, due_date);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
