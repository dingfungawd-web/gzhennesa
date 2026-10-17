CREATE OR REPLACE FUNCTION public.verify_user_login(input_username text, input_password text)
 RETURNS TABLE(user_id uuid, username text)
 LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_hash TEXT; found_user_id UUID; found_username TEXT;
BEGIN
  SELECT ru.id, ru.username, ru.password_hash INTO found_user_id, found_username, stored_hash
  FROM registered_users ru
  WHERE lower(trim(ru.username)) = lower(trim(input_username))
  LIMIT 1;
  IF found_user_id IS NULL OR stored_hash IS NULL THEN RETURN; END IF;
  IF stored_hash = extensions.crypt(input_password, stored_hash) THEN
    RETURN QUERY SELECT found_user_id, found_username;
  END IF;
  RETURN;
END;
$function$;