-- Add is_hidden column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false NOT NULL;

-- Add index for better query performance when filtering by hidden status
CREATE INDEX IF NOT EXISTS idx_profiles_is_hidden ON public.profiles(is_hidden);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_hidden IS 'Indicates whether the user should be hidden from the default admin view';