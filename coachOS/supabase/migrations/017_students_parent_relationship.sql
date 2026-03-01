-- Add parent relationship for parent onboarding form
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_relationship TEXT CHECK (parent_relationship IN ('father', 'mother', 'guardian', 'other'));
