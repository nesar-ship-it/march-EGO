-- RLS policies (depend on 013_helper_functions)

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select ON organizations FOR SELECT USING (
  id = ANY(get_user_org_ids())
  OR (is_student() AND id IN (SELECT org_id FROM students WHERE auth_user_id = auth.uid()))
);

CREATE POLICY branches_select ON branches FOR SELECT USING (
  id = ANY(get_user_branch_ids())
  OR (is_student() AND org_id IN (SELECT org_id FROM students WHERE auth_user_id = auth.uid()))
);

CREATE POLICY staff_select ON staff_profiles FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY staff_insert ON staff_profiles FOR INSERT WITH CHECK (auth_user_id = auth.uid());
CREATE POLICY staff_update ON staff_profiles FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY students_select ON students FOR SELECT USING (
  (auth_user_id = auth.uid())
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);
CREATE POLICY students_update ON students FOR UPDATE USING (
  auth_user_id = auth.uid()
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);

CREATE POLICY batches_select ON batches FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY batches_all ON batches FOR ALL USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY branch_batches_select ON branch_batches FOR SELECT USING (branch_id = ANY(get_user_branch_ids()));
CREATE POLICY branch_batches_all ON branch_batches FOR ALL USING (branch_id = ANY(get_user_branch_ids()));

CREATE POLICY age_groups_select ON age_groups FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY age_groups_all ON age_groups FOR ALL USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY attendance_select ON attendance_records FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY attendance_insert ON attendance_records FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);
CREATE POLICY attendance_update ON attendance_records FOR UPDATE USING (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);

CREATE POLICY payments_select ON payments FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY payments_insert ON payments FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);
CREATE POLICY payments_update ON payments FOR UPDATE USING (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);

CREATE POLICY invites_select ON invites FOR SELECT USING (
  created_by IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid())
  OR (org_id = ANY(get_user_org_ids()) AND get_user_role(org_id) = 'super_admin')
);
CREATE POLICY invites_insert ON invites FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND created_by IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY invites_update ON invites FOR UPDATE USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY audit_select ON audit_logs FOR SELECT USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY whatsapp_select ON whatsapp_logs FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY whatsapp_insert ON whatsapp_logs FOR INSERT WITH CHECK (org_id = ANY(get_user_org_ids()));

CREATE POLICY matches_select ON matches FOR SELECT USING (
  (id IN (SELECT match_id FROM match_participants WHERE student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())))
  OR (org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids()))
);
CREATE POLICY matches_all ON matches FOR ALL USING (
  org_id = ANY(get_user_org_ids()) AND branch_id = ANY(get_user_branch_ids())
);

CREATE POLICY match_participants_select ON match_participants FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  OR match_id IN (SELECT id FROM matches WHERE org_id = ANY(get_user_org_ids()))
);
CREATE POLICY match_participants_all ON match_participants FOR ALL USING (
  match_id IN (SELECT id FROM matches WHERE org_id = ANY(get_user_org_ids()))
);

CREATE POLICY news_posts_select ON news_posts FOR SELECT USING (org_id = ANY(get_user_org_ids()));
CREATE POLICY news_posts_all ON news_posts FOR ALL USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY news_reactions_select ON news_reactions FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
  OR news_post_id IN (SELECT id FROM news_posts WHERE org_id = ANY(get_user_org_ids()))
);
CREATE POLICY news_reactions_insert ON news_reactions FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid())
);

CREATE POLICY coach_notes_select ON coach_notes FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()) AND (get_user_role(org_id) IN ('super_admin', 'branch_admin', 'coach', 'temp_coach')))
);
CREATE POLICY coach_notes_insert ON coach_notes FOR INSERT WITH CHECK (
  org_id = ANY(get_user_org_ids()) AND coach_id IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY coach_notes_update ON coach_notes FOR UPDATE USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY student_documents_select ON student_documents FOR SELECT USING (
  (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
  OR (org_id = ANY(get_user_org_ids()))
);
CREATE POLICY student_documents_insert ON student_documents FOR INSERT WITH CHECK (org_id = ANY(get_user_org_ids()));
