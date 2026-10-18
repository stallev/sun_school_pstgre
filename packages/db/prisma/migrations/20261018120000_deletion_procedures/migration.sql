-- Privileged deletion (deletion_requests_contract §12, Q-03; R-6, INV-16, INV-17).
-- SECURITY DEFINER functions with fixed search_path; app role without direct DELETE/UPDATE.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sunschool_app') THEN
    CREATE ROLE sunschool_app NOLOGIN;
  END IF;
END
$$;

REVOKE DELETE ON TABLE public.brick_ledger FROM PUBLIC;
REVOKE UPDATE ON TABLE public.audit_log FROM PUBLIC;
REVOKE DELETE, UPDATE ON TABLE public.brick_ledger FROM sunschool_app;
REVOKE DELETE, UPDATE ON TABLE public.audit_log FROM sunschool_app;
GRANT SELECT, INSERT ON TABLE public.brick_ledger TO sunschool_app;
GRANT SELECT, INSERT ON TABLE public.audit_log TO sunschool_app;

CREATE OR REPLACE FUNCTION public.sunschool_assert_deletion_privileged()
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF coalesce(current_setting('sunschool.deletion_privileged', true), '') <> '1' THEN
    RAISE EXCEPTION 'deletion privileged context required'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sunschool_privileged_delete_brick_ledger_for_pupil(p_pupil_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  PERFORM public.sunschool_assert_deletion_privileged();

  IF NOT EXISTS (SELECT 1 FROM public.pupil WHERE id = p_pupil_id) THEN
    RETURN 0;
  END IF;

  DELETE FROM public.brick_ledger WHERE pupil_id = p_pupil_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sunschool_privileged_scrub_audit_log_for_pupil(p_pupil_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  scrubbed_count bigint;
  pupil_id_text text := p_pupil_id::text;
BEGIN
  PERFORM public.sunschool_assert_deletion_privileged();

  UPDATE public.audit_log al
  SET
    old_value = NULL,
    new_value = NULL,
    reason = NULL
  WHERE
    (al.entity_type = 'pupil' AND al.entity_id = pupil_id_text)
    OR (
      al.entity_type = 'enrollment'
      AND al.entity_id IN (SELECT e.id::text FROM public.enrollment e WHERE e.pupil_id = p_pupil_id)
    )
    OR (
      al.entity_type = 'child_data_consent'
      AND al.entity_id IN (SELECT c.id::text FROM public.child_data_consent c WHERE c.pupil_id = p_pupil_id)
    )
    OR (
      al.entity_type = 'homework_check'
      AND al.entity_id IN (SELECT h.id::text FROM public.homework_check h WHERE h.pupil_id = p_pupil_id)
    )
    OR (
      al.entity_type = 'brick_ledger'
      AND al.entity_id IN (SELECT b.id::text FROM public.brick_ledger b WHERE b.pupil_id = p_pupil_id)
    );

  GET DIAGNOSTICS scrubbed_count = ROW_COUNT;
  RETURN scrubbed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sunschool_assert_deletion_privileged() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sunschool_privileged_delete_brick_ledger_for_pupil(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sunschool_privileged_scrub_audit_log_for_pupil(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.sunschool_assert_deletion_privileged() TO sunschool_app;
GRANT EXECUTE ON FUNCTION public.sunschool_privileged_delete_brick_ledger_for_pupil(uuid) TO sunschool_app;
GRANT EXECUTE ON FUNCTION public.sunschool_privileged_scrub_audit_log_for_pupil(uuid) TO sunschool_app;

GRANT sunschool_app TO CURRENT_USER;
