-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Attendance Policies
-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE user_id = auth.uid() AND id = attendance.student_id
        )
    );

-- Parents can view attendance of their children
CREATE POLICY "Parents can view children attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE parent_user_id = auth.uid() AND id = attendance.student_id
        )
    );

-- Admins can manage all attendance record
CREATE POLICY "Admins can manage all attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Automatic Profile Sync Trigger
-- Function to sync full_name from profiles to students/parents if needed
CREATE OR REPLACE FUNCTION sync_profile_name()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students SET full_name = NEW.full_name WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_profile_name
AFTER UPDATE OF full_name ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_name();
