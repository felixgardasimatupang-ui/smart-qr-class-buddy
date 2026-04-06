-- =====================================================
-- SMART QR CLASS BUDDY - Complete Database Migration
-- =====================================================
-- This migration creates a complete database schema for:
-- - User authentication with roles (admin, student, parent)
-- - Auto-assign admin role on signup (fixes redirect issue)
-- - Student management with parent linkage
-- - Class management
-- - Session management with QR codes
-- - Attendance tracking via QR scan
-- - Evaluations/grades
-- - Profile management
-- - Real-time attendance updates
-- =====================================================

-- =====================================================
-- PART 1: CLEANUP - Drop existing objects if they exist
-- =====================================================

-- First, drop the trigger on auth.users (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions first (they might be used by triggers/policies)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.evaluations CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.class_students CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.session_status CASCADE;
DROP TYPE IF EXISTS public.attendance_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- =====================================================
-- PART 2: CREATE ENUM TYPES
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'parent');
CREATE TYPE public.attendance_status AS ENUM ('hadir', 'absen', 'izin');
CREATE TYPE public.session_status AS ENUM ('scheduled', 'active', 'completed');

-- =====================================================
-- PART 3: CREATE TABLES
-- =====================================================

-- Profiles table (extends auth.users with additional info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Students table (links students to their accounts and parents)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nis TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  day_of_week TEXT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Class-Students junction table
CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- Sessions table (for attendance tracking with QR codes)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_code TEXT UNIQUE,
  status session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'absen',
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Evaluations table (for grades/evaluations)
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 4: CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to handle new user signup - AUTO-ASSIGNS ADMIN ROLE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- AUTO-ASSIGN 'admin' role to new users (fixes redirect issue!)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PART 5: CREATE TRIGGERS
-- =====================================================

-- Auto-update updated_at for all tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON public.students 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON public.classes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON public.sessions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at 
  BEFORE UPDATE ON public.attendance 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at 
  BEFORE UPDATE ON public.evaluations 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and assign admin role on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 6: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Profiles viewable by authenticated users" 
  ON public.profiles FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" 
  ON public.user_roles FOR SELECT 
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles FOR INSERT 
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
  ON public.user_roles FOR DELETE 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Students policies
CREATE POLICY "Admins can manage students" 
  ON public.students FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own data" 
  ON public.students FOR SELECT 
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Parents can view their children" 
  ON public.students FOR SELECT 
  TO authenticated USING (parent_user_id = auth.uid());

-- Classes policies
CREATE POLICY "Admins can manage classes" 
  ON public.classes FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view classes" 
  ON public.classes FOR SELECT 
  TO authenticated USING (true);

-- Class students policies
CREATE POLICY "Admins can manage class_students" 
  ON public.class_students FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view class_students" 
  ON public.class_students FOR SELECT 
  TO authenticated USING (true);

-- Sessions policies
CREATE POLICY "Admins can manage sessions" 
  ON public.sessions FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view sessions" 
  ON public.sessions FOR SELECT 
  TO authenticated USING (true);

-- Attendance policies
CREATE POLICY "Admins can manage attendance" 
  ON public.attendance FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own attendance" 
  ON public.attendance FOR SELECT 
  TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can insert own attendance" 
  ON public.attendance FOR INSERT 
  TO authenticated WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can view children attendance" 
  ON public.attendance FOR SELECT 
  TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE parent_user_id = auth.uid())
  );

-- Evaluations policies
CREATE POLICY "Admins can manage evaluations" 
  ON public.evaluations FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own evaluations" 
  ON public.evaluations FOR SELECT 
  TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Parents can view children evaluations" 
  ON public.evaluations FOR SELECT 
  TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE parent_user_id = auth.uid())
  );

-- =====================================================
-- PART 7: ENABLE REALTIME
-- =====================================================

-- Enable realtime for attendance (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- =====================================================
-- PART 8: CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_user_id ON public.students(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON public.sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_qr_code ON public.sessions(qr_code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_session_id ON public.evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON public.evaluations(student_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- After running this migration:
-- 1. Disable email confirmation in Supabase (Authentication > Settings)
-- 2. Update your .env file with correct Supabase credentials
-- 3. Register a new user - they will automatically get 'admin' role
-- 4. Login will automatically redirect to /admin dashboard
-- =====================================================