-- 009 — Security hardening (Supabase linter 0011 function_search_path_mutable)
--
-- Pin search_path on the SECURITY DEFINER / trigger functions to close the
-- mutable-search_path privilege-escalation vector. Function BODIES are
-- unchanged: handle_new_user already schema-qualifies public.profiles, and
-- is_admin / set_updated_at use only pg_catalog builtins, so an empty
-- search_path is safe.
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- handle_new_user is a trigger on auth.users; it must not be a PostgREST RPC.
-- Revoke from PUBLIC first (see 010 for the direct anon/authenticated grants
-- that Supabase adds via default privileges). Trigger firing is unaffected —
-- it runs in the table owner's (supabase_auth_admin) context.
--
-- is_admin() is deliberately LEFT executable by anon/authenticated: it is
-- referenced inside RLS policies, so revoking EXECUTE would break policy
-- evaluation and lock users out.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
