-- Staff profiles (links Supabase Auth to org/branch/role)
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id, org_id)
);

CREATE INDEX idx_staff_profiles_auth_user_id ON staff_profiles (auth_user_id);
CREATE INDEX idx_staff_profiles_org_id ON staff_profiles (org_id);
CREATE INDEX idx_staff_profiles_org_branch ON staff_profiles (org_id, branch_id);

CREATE TRIGGER set_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
