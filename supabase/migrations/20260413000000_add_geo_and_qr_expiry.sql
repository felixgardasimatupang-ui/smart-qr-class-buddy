-- Add geolocation tracking columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS geo_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS geo_lng DOUBLE PRECISION;

-- Add QR expiration to sessions for dynamic QR codes
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_geo ON public.attendance(geo_lat, geo_lng);