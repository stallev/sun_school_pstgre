-- Privileged scrub of audit_log rows for adult anonymization (deletion_requests_contract §6.1, INV-16).

CREATE OR REPLACE FUNCTION public.sunschool_privileged_scrub_audit_log_for_user(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  scrubbed_count bigint;
BEGIN
  PERFORM public.sunschool_assert_deletion_privileged();

  UPDATE public.audit_log al
  SET reason = NULL
  WHERE al.actor_user_id = p_user_id;

  GET DIAGNOSTICS scrubbed_count = ROW_COUNT;
  RETURN scrubbed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sunschool_privileged_scrub_audit_log_for_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sunschool_privileged_scrub_audit_log_for_user(uuid) TO sunschool_app;
