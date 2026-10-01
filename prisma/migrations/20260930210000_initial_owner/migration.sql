-- Private durable latch. Revoking/deleting an owner must never reopen initial access.
CREATE TABLE public.initial_owner_setup (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 closed boolean NOT NULL,
 attempt_window timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0
);
INSERT INTO public.initial_owner_setup(id,closed)
 SELECT true, EXISTS(SELECT 1 FROM public."user") OR EXISTS(SELECT 1 FROM public.account);
REVOKE ALL ON public.initial_owner_setup FROM PUBLIC;

CREATE FUNCTION public.close_initial_owner_setup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
 UPDATE public.initial_owner_setup SET closed=true WHERE id=true;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.close_initial_owner_setup() FROM PUBLIC;
CREATE TRIGGER close_initial_setup_user BEFORE INSERT ON public."user"
 FOR EACH ROW EXECUTE FUNCTION public.close_initial_owner_setup();
CREATE TRIGGER close_initial_setup_account BEFORE INSERT ON public.account
 FOR EACH ROW EXECUTE FUNCTION public.close_initial_owner_setup();

CREATE FUNCTION public.initial_owner_available() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
 SELECT NOT closed AND NOT EXISTS(SELECT 1 FROM public."user") AND NOT EXISTS(SELECT 1 FROM public.account)
 FROM public.initial_owner_setup WHERE id=true;
$$;
REVOKE ALL ON FUNCTION public.initial_owner_available() FROM PUBLIC;

-- Reserve an attempt before expensive password hashing; global 5/minute bucket.
CREATE FUNCTION public.reserve_initial_owner_attempt() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE state public.initial_owner_setup%ROWTYPE;
BEGIN
 SELECT * INTO state FROM public.initial_owner_setup WHERE id=true FOR UPDATE;
 IF NOT FOUND OR state.closed OR EXISTS(SELECT 1 FROM public."user") OR EXISTS(SELECT 1 FROM public.account) THEN RETURN false; END IF;
 IF state.attempt_window < now()-interval '1 minute' THEN
  UPDATE public.initial_owner_setup SET attempt_window=now(),attempts=1 WHERE id=true;
  RETURN true;
 END IF;
 IF state.attempts >= 5 THEN RETURN false; END IF;
 UPDATE public.initial_owner_setup SET attempts=attempts+1 WHERE id=true;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_initial_owner_attempt() FROM PUBLIC;

CREATE FUNCTION public.create_initial_owner(owner_id text, owner_name text, owner_email text, password_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE state public.initial_owner_setup%ROWTYPE;
BEGIN
 SELECT * INTO state FROM public.initial_owner_setup WHERE id=true FOR UPDATE;
 IF NOT FOUND OR state.closed OR EXISTS(SELECT 1 FROM public."user") OR EXISTS(SELECT 1 FROM public.account) THEN RETURN false; END IF;
 IF owner_id IS NULL OR length(owner_id)>128 OR owner_name IS NULL OR length(btrim(owner_name)) NOT BETWEEN 1 AND 120
  OR owner_email IS NULL OR length(owner_email)>254 OR owner_email NOT LIKE '%@%'
  OR password_hash IS NULL OR password_hash !~ '^[0-9a-f]{32}:[0-9a-f]{128}$' THEN
  RAISE EXCEPTION 'Invalid initial owner';
 END IF;
 INSERT INTO public."user"(id,name,email,"emailVerified","createdAt","updatedAt","activeAccess")
 VALUES(owner_id,btrim(owner_name),lower(owner_email),false,now(),now(),true);
 INSERT INTO public.account(id,"accountId","providerId","userId",password,"createdAt","updatedAt")
 VALUES(owner_id,owner_id,'credential',owner_id,password_hash,now(),now());
 UPDATE public.initial_owner_setup SET closed=true WHERE id=true;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.create_initial_owner(text,text,text,text) FROM PUBLIC;
