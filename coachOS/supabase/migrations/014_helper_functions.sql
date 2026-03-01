-- Helper function to generate unique student ID codes
CREATE OR REPLACE FUNCTION public.generate_student_id_code(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate 4 digit code first, try up to 10 times
        IF attempts < 10 THEN
            new_code := lpad((floor(random() * 10000))::text, 4, '0');
        ELSE
            -- Generate 5 digit code as fallback
            new_code := lpad((floor(random() * 100000))::text, 5, '0');
        END IF;
        
        -- Check if it exists for this org
        SELECT EXISTS (
            SELECT 1 FROM public.students 
            WHERE org_id = p_org_id AND student_id_code = new_code
        ) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
        attempts := attempts + 1;
        
        IF attempts > 20 THEN
            RAISE EXCEPTION 'Could not generate unique student ID code after 20 attempts';
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Helper function to recalculate student fee status based on payment records
CREATE OR REPLACE FUNCTION public.recalculate_student_fee_status(target_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    new_status TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM public.payments WHERE student_id = target_student_id AND status = 'overdue') THEN
        new_status := 'overdue';
    ELSIF EXISTS (SELECT 1 FROM public.payments WHERE student_id = target_student_id AND status = 'pending') THEN
        new_status := 'unpaid';
    ELSIF EXISTS (SELECT 1 FROM public.payments WHERE student_id = target_student_id AND status = 'partial') THEN
        new_status := 'partial';
    ELSE
        new_status := 'paid';
    END IF;

    UPDATE public.students 
    SET fee_status = new_status 
    WHERE id = target_student_id;
END;
$$;

-- Helper trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the triggers on necessary tables
CREATE TRIGGER update_organizations_modtime BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_modtime BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_profiles_modtime BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_records_modtime BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_modtime BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coach_notes_modtime BEFORE UPDATE ON public.coach_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
