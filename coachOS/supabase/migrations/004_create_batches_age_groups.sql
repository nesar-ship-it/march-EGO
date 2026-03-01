-- Batches (per organization)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  days_of_week TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_batches_org_id ON batches (org_id);

-- Junction: which batches run at which branch
CREATE TABLE branch_batches (
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (branch_id, batch_id)
);

-- Age groups (per organization)
CREATE TABLE age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  gender TEXT DEFAULT 'all' CHECK (gender IN ('male', 'female', 'all')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE INDEX idx_age_groups_org_id ON age_groups (org_id);
