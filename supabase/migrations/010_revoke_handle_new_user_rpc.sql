-- 010 — Finish locking down handle_new_user RPC exposure
--
-- The REVOKE FROM PUBLIC in 009 was not enough: Supabase grants EXECUTE
-- directly to anon/authenticated via default privileges, so the function was
-- still reachable at /rest/v1/rpc/handle_new_user. handle_new_user is ONLY a
-- trigger on auth.users (fires as supabase_auth_admin), so removing the API
-- roles' EXECUTE does not affect signup — it only removes the RPC exposure.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
