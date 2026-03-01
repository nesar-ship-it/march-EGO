-- Helper functions for RLS (014) and Edge Functions. Must run before 014_rls_policies.

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(org_id), '{}')::UUID[]
  FROM staff_profiles
  WHERE auth_user_id = auth.uid() AND is_active = true
    AND (access_expires_at IS NULL OR access_expires_at > now());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_branch_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(DISTINCT bid), '{}')::UUID[]
  FROM (
    SELECT CASE WHEN sp.branch_id IS NOT NULL THEN sp.branch_id ELSE b.id END AS bid
    FROM staff_profiles sp
    LEFT JOIN branches b ON b.org_id = sp.org_id AND b.is_active = true
    WHERE sp.auth_user_id = auth.uid() AND sp.is_active = true
      AND (sp.access_expires_at IS NULL OR sp.access_expires_at > now())
  ) x
  WHERE bid IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM staff_profiles
  WHERE auth_user_id = auth.uid() AND org_id = p_org_id AND is_active = true
    AND (access_expires_at IS NULL OR access_expires_at > now())
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM students WHERE auth_user_id = auth.uid() AND enrollment_status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_student_id_code(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  i INT := 0;
BEGIN
  LOOP
    code := lpad(floor(random() * 10000)::int::text, 4, '0');
    IF code = '0000' THEN code := '0001'; END IF;
    IF NOT EXISTS (SELECT 1 FROM students WHERE org_id = p_org_id AND student_id_code = code) THEN
      RETURN code;
    END IF;
    i := i + 1;
    IF i >= 10 THEN
      code := lpad(floor(random() * 100000)::int::text, 5, '0');
      IF NOT EXISTS (SELECT 1 FROM students WHERE org_id = p_org_id AND student_id_code = code) THEN
        RETURN code;
      END IF;
    END IF;
    EXIT WHEN i >= 20;
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_audit(
  p_org_id UUID,
  p_branch_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
  INSERT INTO audit_logs (org_id, branch_id, actor_id, actor_role, action, entity_type, entity_id, details)
  VALUES (p_org_id, p_branch_id, p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id, p_details);
$$ LANGUAGE sql SECURITY DEFINER;
