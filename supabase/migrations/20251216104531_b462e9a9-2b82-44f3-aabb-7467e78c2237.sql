-- Drop existing functions first
DROP FUNCTION IF EXISTS public.hash_password(TEXT);
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT);

-- Recreate functions with proper schema path
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf', 8));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN stored_hash = extensions.crypt(input_password, stored_hash);
END;
$$;