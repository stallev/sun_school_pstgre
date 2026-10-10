-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('client', 'trainer', 'admin');

-- CreateEnum
CREATE TYPE "ui_theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "trainer_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "complaint_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "complaint_status" AS ENUM ('open', 'in_review', 'closed');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "file_upload_status" AS ENUM ('pending', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "delivery_channel" AS ENUM ('email');

-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMPTZ,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'client',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "ui_theme" "ui_theme" NOT NULL DEFAULT 'system',
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "status" "trainer_status" NOT NULL DEFAULT 'pending',
    "timezone" TEXT NOT NULL,
    "bio" TEXT,
    "photo_url" TEXT,
    "experience_years" SMALLINT,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMPTZ,
    "reviewed_at" TIMESTAMPTZ,
    "reviewed_by_id" UUID,
    "rejection_reason" TEXT,
    "stripe_account_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trainer_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_specialization" (
    "trainer_profile_id" UUID NOT NULL,
    "specialization_id" UUID NOT NULL,

    CONSTRAINT "trainer_specialization_pkey" PRIMARY KEY ("trainer_profile_id","specialization_id")
);

-- CreateTable
CREATE TABLE "trainer_certificate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "file_asset_id" UUID,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_profile_id" UUID NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" SMALLINT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trainer_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_weekly_interval" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_profile_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trainer_weekly_interval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_schedule_exception" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_profile_id" UUID NOT NULL,
    "exception_date" DATE NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_schedule_exception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "trainer_profile_id" UUID NOT NULL,
    "trainer_service_id" UUID NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'pending',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "service_name_snapshot" TEXT NOT NULL,
    "client_message" TEXT,
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_by_id" UUID,
    "completed_at" TIMESTAMPTZ,
    "completed_by_id" UUID,
    "stripe_payment_intent_id" TEXT,
    "stripe_refund_id" TEXT,
    "daily_room_name" TEXT,
    "daily_room_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "client_id" UUID NOT NULL,
    "trainer_profile_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("client_id","trainer_profile_id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "trainer_profile_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "body" TEXT NOT NULL,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "hidden_by_id" UUID,
    "hidden_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_client_note" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_profile_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trainer_client_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" UUID NOT NULL,
    "target_trainer_id" UUID,
    "target_booking_id" UUID,
    "priority" "complaint_priority" NOT NULL DEFAULT 'medium',
    "status" "complaint_status" NOT NULL DEFAULT 'open',
    "reason" TEXT NOT NULL,
    "admin_notes" TEXT,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "refund_status" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "admin_comment" TEXT,
    "processed_by_id" UUID,
    "processed_at" TIMESTAMPTZ,
    "stripe_refund_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refund_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_asset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_user_id" UUID NOT NULL,
    "blob_url" TEXT,
    "blob_pathname" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "upload_status" "file_upload_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "file_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_execution" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idempotency_key" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'pending',
    "payload_json" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMPTZ,
    "finished_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "job_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idempotency_key" TEXT NOT NULL,
    "channel" "delivery_channel" NOT NULL DEFAULT 'email',
    "user_id" UUID,
    "booking_id" UUID,
    "target" TEXT,
    "template_key" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" "delivery_status" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "delivery_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "user"("role");

-- CreateIndex
CREATE INDEX "idx_password_reset_user" ON "password_reset_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_password_reset_token_hash" ON "password_reset_token"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_profile_user_id_key" ON "trainer_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_profile_stripe_account_id_key" ON "trainer_profile"("stripe_account_id");

-- CreateIndex
CREATE INDEX "idx_trainer_profile_status" ON "trainer_profile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "specialization_slug_key" ON "specialization"("slug");

-- CreateIndex
CREATE INDEX "idx_trainer_certificate_profile" ON "trainer_certificate"("trainer_profile_id");

-- CreateIndex
CREATE INDEX "idx_verification_doc_profile" ON "verification_document"("trainer_profile_id");

-- CreateIndex
CREATE INDEX "idx_trainer_service_profile_active" ON "trainer_service"("trainer_profile_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_weekly_interval_profile_day" ON "trainer_weekly_interval"("trainer_profile_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_schedule_exception_trainer_profile_id_exception_dat_key" ON "trainer_schedule_exception"("trainer_profile_id", "exception_date");

-- CreateIndex
CREATE UNIQUE INDEX "booking_stripe_payment_intent_id_key" ON "booking"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "idx_booking_client_status" ON "booking"("client_id", "status", "starts_at" DESC);

-- CreateIndex
CREATE INDEX "idx_booking_trainer_starts" ON "booking"("trainer_profile_id", "starts_at");

-- CreateIndex
CREATE INDEX "idx_booking_trainer_day" ON "booking"("trainer_profile_id", "starts_at");

-- CreateIndex
CREATE INDEX "idx_wishlist_trainer" ON "wishlist"("trainer_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_booking_id_key" ON "review"("booking_id");

-- CreateIndex
CREATE INDEX "idx_review_trainer_visible" ON "review"("trainer_profile_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "trainer_client_note_trainer_profile_id_client_id_key" ON "trainer_client_note"("trainer_profile_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_complaint_status_priority" ON "complaint"("status", "priority", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refund_request_stripe_refund_id_key" ON "refund_request"("stripe_refund_id");

-- CreateIndex
CREATE INDEX "idx_refund_status" ON "refund_request"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_file_asset_owner" ON "file_asset"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_execution_idempotency_key_key" ON "job_execution"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_job_status_type" ON "job_execution"("status", "job_type");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_log_idempotency_key_key" ON "delivery_log"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_delivery_user_created" ON "delivery_log"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_delivery_booking" ON "delivery_log"("booking_id");

-- CreateIndex
CREATE INDEX "idx_audit_actor_created" ON "audit_log"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_target" ON "audit_log"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_profile" ADD CONSTRAINT "trainer_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_profile" ADD CONSTRAINT "trainer_profile_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_specialization" ADD CONSTRAINT "trainer_specialization_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_specialization" ADD CONSTRAINT "trainer_specialization_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "specialization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_certificate" ADD CONSTRAINT "trainer_certificate_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_certificate" ADD CONSTRAINT "trainer_certificate_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_document" ADD CONSTRAINT "verification_document_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_document" ADD CONSTRAINT "verification_document_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_service" ADD CONSTRAINT "trainer_service_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_weekly_interval" ADD CONSTRAINT "trainer_weekly_interval_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_schedule_exception" ADD CONSTRAINT "trainer_schedule_exception_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_trainer_service_id_fkey" FOREIGN KEY ("trainer_service_id") REFERENCES "trainer_service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_hidden_by_id_fkey" FOREIGN KEY ("hidden_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_client_note" ADD CONSTRAINT "trainer_client_note_trainer_profile_id_fkey" FOREIGN KEY ("trainer_profile_id") REFERENCES "trainer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_client_note" ADD CONSTRAINT "trainer_client_note_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_target_trainer_id_fkey" FOREIGN KEY ("target_trainer_id") REFERENCES "trainer_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_target_booking_id_fkey" FOREIGN KEY ("target_booking_id") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint" ADD CONSTRAINT "complaint_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_request" ADD CONSTRAINT "refund_request_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_request" ADD CONSTRAINT "refund_request_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_request" ADD CONSTRAINT "refund_request_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_asset" ADD CONSTRAINT "file_asset_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
