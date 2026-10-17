-- Drop Telegram profile fields; only provider_account_id (sub) is retained (ADR-003 v1.2).
ALTER TABLE "login_identity" DROP COLUMN "phone", DROP COLUMN "username";
