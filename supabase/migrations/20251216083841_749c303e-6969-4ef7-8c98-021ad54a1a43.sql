-- Create users table for username-based registration
CREATE TABLE public.registered_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if username exists (for login validation)
CREATE POLICY "Anyone can check usernames" 
ON public.registered_users 
FOR SELECT 
USING (true);

-- Allow anyone to register (insert)
CREATE POLICY "Anyone can register" 
ON public.registered_users 
FOR INSERT 
WITH CHECK (true);