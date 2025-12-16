-- Fix PUBLIC_DATA_EXPOSURE: Remove permissive SELECT policy that exposes password hashes
DROP POLICY IF EXISTS "Anyone can check usernames" ON registered_users;

-- Create secure RPC function to check if username exists (without exposing data)
CREATE OR REPLACE FUNCTION public.check_username_exists(check_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM registered_users WHERE username = check_username);
$$;

-- Create secure RPC function to verify login (returns user_id if valid, null otherwise)
CREATE OR REPLACE FUNCTION public.verify_user_login(input_username TEXT, input_password TEXT)
RETURNS TABLE(user_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash TEXT;
  found_user_id UUID;
  found_username TEXT;
BEGIN
  -- Get user data
  SELECT ru.id, ru.username, ru.password_hash 
  INTO found_user_id, found_username, stored_hash
  FROM registered_users ru
  WHERE ru.username = input_username;
  
  -- If user not found or no password hash, return empty
  IF found_user_id IS NULL OR stored_hash IS NULL THEN
    RETURN;
  END IF;
  
  -- Verify password
  IF stored_hash = extensions.crypt(input_password, stored_hash) THEN
    RETURN QUERY SELECT found_user_id, found_username;
  END IF;
  
  -- Password invalid, return empty
  RETURN;
END;
$$;

-- Create session tokens table for server-side session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- No direct access to sessions table - only via RPC functions
-- Create function to generate session token
CREATE OR REPLACE FUNCTION public.create_user_session(input_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate a secure random token
  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  -- Delete expired sessions for this user
  DELETE FROM user_sessions WHERE user_id = input_user_id AND expires_at < now();
  
  -- Insert new session
  INSERT INTO user_sessions (user_id, token) VALUES (input_user_id, new_token);
  
  RETURN new_token;
END;
$$;

-- Create function to validate session and get user info
CREATE OR REPLACE FUNCTION public.validate_session(input_token TEXT)
RETURNS TABLE(user_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.user_id, u.username
  FROM user_sessions s
  JOIN registered_users u ON u.id = s.user_id
  WHERE s.token = input_token AND s.expires_at > now();
END;
$$;

-- Create function to delete session (logout)
CREATE OR REPLACE FUNCTION public.delete_user_session(input_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM user_sessions WHERE token = input_token;
$$;