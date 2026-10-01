-- User-authorized self-registration: every new account has shared owner access.
CREATE TABLE public.public_registration_limit (
 id boolean PRIMARY KEY DEFAULT true CHECK (id=true),
 attempt_window timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts>=0)
);
INSERT INTO public.public_registration_limit(id) VALUES(true);
REVOKE ALL ON public.public_registration_limit FROM PUBLIC;

CREATE FUNCTION public.reserve_public_registration_attempt() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE state public.public_registration_limit%ROWTYPE;
BEGIN
 SELECT * INTO state FROM public.public_registration_limit WHERE id=true FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF state.attempt_window < now()-interval '1 minute' THEN
  UPDATE public.public_registration_limit SET attempt_window=now(),attempts=1 WHERE id=true;
  RETURN true;
 END IF;
 IF state.attempts>=5 THEN RETURN false; END IF;
 UPDATE public.public_registration_limit SET attempts=attempts+1 WHERE id=true;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_public_registration_attempt() FROM PUBLIC;

CREATE FUNCTION public.register_owner_account(owner_id text,owner_name text,owner_email text,password_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF owner_id IS NULL OR length(owner_id) NOT BETWEEN 1 AND 128
  OR owner_name IS NULL OR length(btrim(owner_name)) NOT BETWEEN 1 AND 120
  OR owner_email IS NULL OR length(owner_email)>254 OR owner_email NOT LIKE '%@%'
  OR password_hash IS NULL OR length(password_hash) NOT BETWEEN 80 AND 512 THEN
  RAISE EXCEPTION 'Invalid registration';
 END IF;
 INSERT INTO public."user"(id,name,email,"emailVerified","createdAt","updatedAt","activeAccess")
 VALUES(owner_id,btrim(owner_name),lower(btrim(owner_email)),false,now(),now(),true);
 INSERT INTO public.account(id,"accountId","providerId","userId",password,"createdAt","updatedAt")
 VALUES(owner_id,owner_id,'credential',owner_id,password_hash,now(),now());
 RETURN true;
EXCEPTION WHEN unique_violation THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.register_owner_account(text,text,text,text) FROM PUBLIC;
