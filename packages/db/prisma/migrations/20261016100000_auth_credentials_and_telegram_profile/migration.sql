-- ADR-003 v1.1 (2026-10-16): Google is not used; the administrator signs in with email + password.
-- LOGIN_PROVIDER: GOOGLE -> CREDENTIALS (no rows used GOOGLE: nobody could sign in with it yet).
ALTER TYPE "login_provider_enum" RENAME VALUE 'GOOGLE' TO 'CREDENTIALS';

-- Telegram profile data (phone, username) and the administrator's password.
ALTER TABLE "login_identity"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "password_hash" TEXT,
  ADD COLUMN "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until" TIMESTAMPTZ(6);

-- A password hash exists exactly for CREDENTIALS identities (database_schema_v1 §5.1).
ALTER TABLE "login_identity"
  ADD CONSTRAINT "login_identity_password_hash_provider_check"
  CHECK (("provider" = 'CREDENTIALS') = ("password_hash" IS NOT NULL));
