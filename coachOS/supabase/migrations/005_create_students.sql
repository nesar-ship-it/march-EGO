-- Students (main entity per branch)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  student_id_code TEXT NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  date_of_birth DATE,
  age INTEGER,
  blood_group TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  school_name TEXT,
  school_grade TEXT,
  address TEXT,
  city TEXT,
  parent_phone TEXT,
  parent_name TEXT,
  parent_relationship TEXT CHECK (parent_relationship IN ('father', 'mother', 'guardian', 'other')),
  guardian_phone TEXT,
  guardian_name TEXT,
  age_group_id UUID REFERENCES age_groups(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  uniform_size TEXT,
  uniform_gender TEXT CHECK (uniform_gender IN ('boy', 'girl', 'unisex')),
  health_notes TEXT,
  special_needs TEXT,
  profile_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (profile_status IN ('incomplete', 'complete')),
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('active', 'paused', 'archived')),
  fee_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (fee_status IN ('paid', 'unpaid', 'overdue', 'partial')),
  username TEXT UNIQUE,
  parent_onboarding_token TEXT UNIQUE,
  parent_onboarding_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, student_id_code)
);

CREATE INDEX idx_students_org_id ON students (org_id);
CREATE INDEX idx_students_branch_id ON students (branch_id);
CREATE INDEX idx_students_batch_id ON students (batch_id);
CREATE INDEX idx_students_org_enrollment ON students (org_id, enrollment_status);
CREATE INDEX idx_students_auth_user_id ON students (auth_user_id);
CREATE INDEX idx_students_parent_token ON students (parent_onboarding_token);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
