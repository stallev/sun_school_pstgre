-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "account_status_enum" AS ENUM ('REGISTRATION', 'REQUEST_PENDING', 'REJECTED', 'ACTIVE', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "login_provider_enum" AS ENUM ('GOOGLE', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "access_request_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "academic_year_status_enum" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "lesson_kind_enum" AS ENUM ('REGULAR', 'REVIEW');

-- CreateEnum
CREATE TYPE "lesson_status_enum" AS ENUM ('HELD', 'CHECK_COMPLETED');

-- CreateEnum
CREATE TYPE "score_source_enum" AS ENUM ('MANUAL', 'VOICE');

-- CreateEnum
CREATE TYPE "grade_event_type_enum" AS ENUM ('LESSON', 'TRIP', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "consent_channel_enum" AS ENUM ('ELECTRONIC', 'PAPER');

-- CreateEnum
CREATE TYPE "consent_status_enum" AS ENUM ('ACTIVE', 'REVOKED', 'LEGACY_PENDING');

-- CreateEnum
CREATE TYPE "deletion_request_type_enum" AS ENUM ('ACCOUNT', 'CHILD_DATA');

-- CreateEnum
CREATE TYPE "deletion_request_status_enum" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "bible_translation_status_enum" AS ENUM ('NO_DATA', 'LOADING', 'READY');

-- CreateEnum
CREATE TYPE "app_locale_enum" AS ENUM ('RU', 'EN');

-- CreateEnum
CREATE TYPE "consent_type_enum" AS ENUM ('PD_PROCESSING', 'CHILD_DATA', 'VOICE', 'PHOTO');

-- CreateEnum
CREATE TYPE "adult_relation_enum" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "achievement_kind_enum" AS ENUM ('REWARD', 'PENALTY');

-- CreateEnum
CREATE TYPE "award_source_enum" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "penalty_status_enum" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "recitation_status_enum" AS ENUM ('UPLOADED', 'PROCESSING', 'SCORED', 'FAILED');

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "last_name" TEXT,
    "first_name" TEXT,
    "middle_name" TEXT,
    "email" TEXT,
    "status" "account_status_enum" NOT NULL,
    "first_login_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "deleted_ordinal" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_identity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "login_provider_enum" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" "user_role_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_consent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "text_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "type" "consent_type_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_id" UUID NOT NULL,
    "full_name_snapshot" TEXT NOT NULL,
    "status" "access_request_status_enum" NOT NULL,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "reject_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "access_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_year" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE NOT NULL,
    "status" "academic_year_status_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academic_year_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "language" "app_locale_enum" NOT NULL DEFAULT 'RU',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "use_verses" BOOLEAN NOT NULL DEFAULT true,
    "use_test" BOOLEAN NOT NULL DEFAULT true,
    "use_notebook" BOOLEAN NOT NULL DEFAULT true,
    "use_singing" BOOLEAN NOT NULL DEFAULT true,
    "max_verses_per_lesson" INTEGER NOT NULL DEFAULT 3,
    "labels" JSONB NOT NULL DEFAULT '{}',
    "weights" JSONB NOT NULL DEFAULT '{}',
    "recitation_days_n" INTEGER NOT NULL DEFAULT 3,
    "achievements_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grade_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pupil" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "birth_date" DATE,
    "photo_ref" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "family_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pupil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_data_consent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "guardian_adult_id" UUID,
    "signer_name" TEXT,
    "channel" "consent_channel_enum" NOT NULL,
    "text_version" TEXT NOT NULL,
    "signed_on" DATE,
    "paper_storage_note" TEXT,
    "marked_by" UUID NOT NULL,
    "status" "consent_status_enum" NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "child_data_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_translation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "locale" "app_locale_enum" NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "source" TEXT,
    "license" TEXT,
    "status" "bible_translation_status_enum" NOT NULL DEFAULT 'NO_DATA',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bible_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_book" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sort_order" INTEGER NOT NULL,
    "testament" TEXT NOT NULL,
    "title_ru" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "short_ru" TEXT NOT NULL,
    "short_en" TEXT NOT NULL,
    "chapters_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bible_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_verse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "translation_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "verse_number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "verse_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bible_verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "golden_verse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "start_chapter" INTEGER NOT NULL,
    "start_verse" INTEGER NOT NULL,
    "end_chapter" INTEGER NOT NULL,
    "end_verse" INTEGER NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "golden_verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_verse_map" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "translation_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "verse_number" INTEGER NOT NULL,
    "common_chapter" INTEGER NOT NULL,
    "common_verse" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bible_verse_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "lesson_date" DATE NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "lead_teacher_id" UUID NOT NULL,
    "kind" "lesson_kind_enum" NOT NULL,
    "body" TEXT,
    "has_test" BOOLEAN NOT NULL DEFAULT false,
    "status" "lesson_status_enum" NOT NULL DEFAULT 'HELD',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_golden_verse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_id" UUID NOT NULL,
    "golden_verse_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_golden_verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_check" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_id" UUID NOT NULL,
    "pupil_id" UUID NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "homework_checked" BOOLEAN NOT NULL DEFAULT false,
    "test_score" INTEGER,
    "notebook_score" INTEGER,
    "singing" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "points_total" INTEGER,
    "scoring_snapshot" JSONB,
    "checked_by" UUID NOT NULL,
    "checked_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "homework_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_verse_score" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "check_id" UUID NOT NULL,
    "lesson_verse_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "source" "score_source_enum" NOT NULL DEFAULT 'MANUAL',
    "scored_at" TIMESTAMPTZ(6) NOT NULL,
    "scored_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_verse_score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_score_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "check_id" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB,
    "set_at" TIMESTAMPTZ(6) NOT NULL,
    "set_by" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_score_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brick_ledger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "issued_on" DATE NOT NULL,
    "issued_by" UUID NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brick_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_id" UUID NOT NULL,
    "event_date" DATE NOT NULL,
    "type" "grade_event_type_enum" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lesson_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grade_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_user_id" UUID,
    "source" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "deletion_request_type_enum" NOT NULL,
    "subject_user_id" UUID,
    "subject_pupil_id" UUID,
    "requested_by" UUID NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" TEXT,
    "status" "deletion_request_status_enum" NOT NULL DEFAULT 'NEW',
    "due_on" DATE NOT NULL,
    "taken_by" UUID,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "reject_reason" TEXT,
    "summary" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "deletion_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_setting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "app_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description_ru" TEXT,
    "description_en" TEXT,
    "icon" TEXT,
    "category" TEXT,
    "kind" "achievement_kind_enum" NOT NULL,
    "rule_type" TEXT NOT NULL,
    "metric" TEXT,
    "threshold" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_tier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "achievement_id" UUID NOT NULL,
    "tier" INTEGER NOT NULL,
    "length" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_award" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "tier" INTEGER NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "rule_snapshot" JSONB NOT NULL,
    "source" "award_source_enum" NOT NULL,
    "awarded_by" UUID,
    "reason" TEXT,
    "awarded_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,
    "revoked_reason" TEXT,
    "award_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "award_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "tier" INTEGER NOT NULL,
    "check_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalty" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "issued_by" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "penalty_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_achievement_period" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_settings_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_achievement_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_adult" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "relation" "adult_relation_enum" NOT NULL,
    "phones" JSONB NOT NULL DEFAULT '[]',
    "email" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "family_adult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_digest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "payload" JSONB NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_digest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recitation_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "lesson_verse_id" UUID NOT NULL,
    "recorded_by" UUID NOT NULL,
    "audio_ref" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_s" INTEGER NOT NULL,
    "audio_deleted_at" TIMESTAMPTZ(6),
    "status" "recitation_status_enum" NOT NULL DEFAULT 'UPLOADED',
    "fail_reason" TEXT,
    "transcript" TEXT,
    "match_percent" INTEGER,
    "word_markup" JSONB,
    "model_id" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "translation_id" UUID NOT NULL,
    "quality" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recitation_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_photo_consent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "given_by" UUID NOT NULL,
    "type" "consent_type_enum" NOT NULL,
    "text_version" TEXT NOT NULL,
    "given_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "consent_status_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_photo_consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_user_organization_id_idx" ON "app_user"("organization_id");

-- CreateIndex
CREATE INDEX "app_user_status_idx" ON "app_user"("status");

-- CreateIndex
CREATE INDEX "login_identity_user_id_idx" ON "login_identity"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "login_identity_provider_provider_account_id_key" ON "login_identity"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_role_key" ON "user_role"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_consent_user_id_text_version_key" ON "privacy_consent"("user_id", "text_version");

-- CreateIndex
CREATE INDEX "access_request_user_id_idx" ON "access_request"("user_id");

-- CreateIndex
CREATE INDEX "access_request_status_idx" ON "access_request"("status");

-- CreateIndex
CREATE INDEX "academic_year_organization_id_status_idx" ON "academic_year"("organization_id", "status");

-- CreateIndex
CREATE INDEX "grade_organization_id_idx" ON "grade"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_settings_grade_id_academic_year_id_key" ON "grade_settings"("grade_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "teacher_assignment_grade_id_academic_year_id_idx" ON "teacher_assignment"("grade_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignment_user_id_grade_id_academic_year_id_key" ON "teacher_assignment"("user_id", "grade_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "pupil_organization_id_idx" ON "pupil"("organization_id");

-- CreateIndex
CREATE INDEX "enrollment_grade_id_academic_year_id_idx" ON "enrollment"("grade_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "enrollment_pupil_id_idx" ON "enrollment"("pupil_id");

-- CreateIndex
CREATE INDEX "child_data_consent_pupil_id_idx" ON "child_data_consent"("pupil_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_translation_code_key" ON "bible_translation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bible_book_sort_order_key" ON "bible_book"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verse_translation_id_book_id_chapter_number_verse_num_key" ON "bible_verse"("translation_id", "book_id", "chapter_number", "verse_number");

-- CreateIndex
CREATE UNIQUE INDEX "golden_verse_organization_id_book_id_start_chapter_start_ve_key" ON "golden_verse"("organization_id", "book_id", "start_chapter", "start_verse", "end_chapter", "end_verse");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verse_map_translation_id_book_id_chapter_number_verse_key" ON "bible_verse_map"("translation_id", "book_id", "chapter_number", "verse_number");

-- CreateIndex
CREATE INDEX "lesson_grade_id_academic_year_id_lesson_date_idx" ON "lesson"("grade_id", "academic_year_id", "lesson_date");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_golden_verse_lesson_id_position_key" ON "lesson_golden_verse"("lesson_id", "position");

-- CreateIndex
CREATE INDEX "homework_check_lesson_id_idx" ON "homework_check"("lesson_id");

-- CreateIndex
CREATE INDEX "homework_check_pupil_id_idx" ON "homework_check"("pupil_id");

-- CreateIndex
CREATE UNIQUE INDEX "homework_check_lesson_id_pupil_id_key" ON "homework_check"("lesson_id", "pupil_id");

-- CreateIndex
CREATE UNIQUE INDEX "homework_verse_score_check_id_lesson_verse_id_key" ON "homework_verse_score"("check_id", "lesson_verse_id");

-- CreateIndex
CREATE INDEX "homework_score_event_check_id_idx" ON "homework_score_event"("check_id");

-- CreateIndex
CREATE INDEX "brick_ledger_pupil_id_academic_year_id_idx" ON "brick_ledger"("pupil_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "grade_event_grade_id_event_date_idx" ON "grade_event"("grade_id", "event_date");

-- CreateIndex
CREATE INDEX "audit_log_occurred_at_idx" ON "audit_log"("occurred_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_idx" ON "audit_log"("actor_user_id");

-- CreateIndex
CREATE INDEX "deletion_request_status_due_on_idx" ON "deletion_request"("status", "due_on");

-- CreateIndex
CREATE UNIQUE INDEX "app_setting_key_key" ON "app_setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_code_key" ON "achievement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_tier_achievement_id_tier_key" ON "achievement_tier"("achievement_id", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_award_award_key_key" ON "achievement_award"("award_key");

-- CreateIndex
CREATE INDEX "achievement_award_pupil_id_academic_year_id_idx" ON "achievement_award"("pupil_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_evidence_achievement_id_tier_check_id_key" ON "achievement_evidence"("achievement_id", "tier", "check_id");

-- CreateIndex
CREATE INDEX "penalty_pupil_id_idx" ON "penalty"("pupil_id");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_identity" ADD CONSTRAINT "login_identity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_consent" ADD CONSTRAINT "privacy_consent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_request" ADD CONSTRAINT "access_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_request" ADD CONSTRAINT "access_request_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "privacy_consent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_request" ADD CONSTRAINT "access_request_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_year" ADD CONSTRAINT "academic_year_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade" ADD CONSTRAINT "grade_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_settings" ADD CONSTRAINT "grade_settings_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_settings" ADD CONSTRAINT "grade_settings_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment" ADD CONSTRAINT "teacher_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment" ADD CONSTRAINT "teacher_assignment_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignment" ADD CONSTRAINT "teacher_assignment_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pupil" ADD CONSTRAINT "pupil_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pupil" ADD CONSTRAINT "pupil_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_data_consent" ADD CONSTRAINT "child_data_consent_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_data_consent" ADD CONSTRAINT "child_data_consent_guardian_adult_id_fkey" FOREIGN KEY ("guardian_adult_id") REFERENCES "family_adult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_data_consent" ADD CONSTRAINT "child_data_consent_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse" ADD CONSTRAINT "bible_verse_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "bible_translation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse" ADD CONSTRAINT "bible_verse_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golden_verse" ADD CONSTRAINT "golden_verse_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golden_verse" ADD CONSTRAINT "golden_verse_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse_map" ADD CONSTRAINT "bible_verse_map_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "bible_translation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse_map" ADD CONSTRAINT "bible_verse_map_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_lead_teacher_id_fkey" FOREIGN KEY ("lead_teacher_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_golden_verse" ADD CONSTRAINT "lesson_golden_verse_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_golden_verse" ADD CONSTRAINT "lesson_golden_verse_golden_verse_id_fkey" FOREIGN KEY ("golden_verse_id") REFERENCES "golden_verse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_check" ADD CONSTRAINT "homework_check_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_check" ADD CONSTRAINT "homework_check_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_check" ADD CONSTRAINT "homework_check_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_verse_score" ADD CONSTRAINT "homework_verse_score_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "homework_check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_verse_score" ADD CONSTRAINT "homework_verse_score_lesson_verse_id_fkey" FOREIGN KEY ("lesson_verse_id") REFERENCES "lesson_golden_verse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_verse_score" ADD CONSTRAINT "homework_verse_score_scored_by_fkey" FOREIGN KEY ("scored_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_score_event" ADD CONSTRAINT "homework_score_event_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "homework_check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_score_event" ADD CONSTRAINT "homework_score_event_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brick_ledger" ADD CONSTRAINT "brick_ledger_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brick_ledger" ADD CONSTRAINT "brick_ledger_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brick_ledger" ADD CONSTRAINT "brick_ledger_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_event" ADD CONSTRAINT "grade_event_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_event" ADD CONSTRAINT "grade_event_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_subject_pupil_id_fkey" FOREIGN KEY ("subject_pupil_id") REFERENCES "pupil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_taken_by_fkey" FOREIGN KEY ("taken_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_tier" ADD CONSTRAINT "achievement_tier_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_award" ADD CONSTRAINT "achievement_award_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_award" ADD CONSTRAINT "achievement_award_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_award" ADD CONSTRAINT "achievement_award_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_award" ADD CONSTRAINT "achievement_award_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_evidence" ADD CONSTRAINT "achievement_evidence_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "achievement_award"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_evidence" ADD CONSTRAINT "achievement_evidence_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_evidence" ADD CONSTRAINT "achievement_evidence_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "homework_check"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty" ADD CONSTRAINT "penalty_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty" ADD CONSTRAINT "penalty_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty" ADD CONSTRAINT "penalty_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty" ADD CONSTRAINT "penalty_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_achievement_period" ADD CONSTRAINT "grade_achievement_period_grade_settings_id_fkey" FOREIGN KEY ("grade_settings_id") REFERENCES "grade_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family" ADD CONSTRAINT "family_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_adult" ADD CONSTRAINT "family_adult_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_adult" ADD CONSTRAINT "family_adult_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_digest" ADD CONSTRAINT "weekly_digest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recitation_attempt" ADD CONSTRAINT "recitation_attempt_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recitation_attempt" ADD CONSTRAINT "recitation_attempt_lesson_verse_id_fkey" FOREIGN KEY ("lesson_verse_id") REFERENCES "lesson_golden_verse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recitation_attempt" ADD CONSTRAINT "recitation_attempt_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recitation_attempt" ADD CONSTRAINT "recitation_attempt_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "bible_translation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_photo_consent" ADD CONSTRAINT "voice_photo_consent_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_photo_consent" ADD CONSTRAINT "voice_photo_consent_given_by_fkey" FOREIGN KEY ("given_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Constraints Prisma cannot express (database_schema_v1.md §5, §7)
-- ---------------------------------------------------------------------------

-- R-1: at most one ACTIVE academic year per organization (БП-6)
CREATE UNIQUE INDEX "academic_year_one_active_per_org"
  ON "academic_year" ("organization_id") WHERE "status" = 'ACTIVE';

-- R-2: at most one open enrollment per pupil
CREATE UNIQUE INDEX "enrollment_one_open_per_pupil"
  ON "enrollment" ("pupil_id") WHERE "ends_on" IS NULL;

-- access_request: at most one PENDING per user
CREATE UNIQUE INDEX "access_request_one_pending_per_user"
  ON "access_request" ("user_id") WHERE "status" = 'PENDING';

-- bible_translation: one default per locale
CREATE UNIQUE INDEX "bible_translation_one_default_per_locale"
  ON "bible_translation" ("locale") WHERE "is_default";

-- deletion_request: subject is exactly one of user / pupil; one open request per subject
ALTER TABLE "deletion_request" ADD CONSTRAINT "deletion_request_one_subject"
  CHECK (("subject_user_id" IS NULL) <> ("subject_pupil_id" IS NULL));
CREATE UNIQUE INDEX "deletion_request_one_open_per_subject"
  ON "deletion_request" (COALESCE("subject_user_id", "subject_pupil_id"))
  WHERE "status" IN ('NEW', 'IN_PROGRESS');

-- child_data_consent: signed_on may be NULL only for LEGACY_PENDING (ADR-011)
ALTER TABLE "child_data_consent" ADD CONSTRAINT "child_data_consent_signed_on_required"
  CHECK ("signed_on" IS NOT NULL OR "status" = 'LEGACY_PENDING');

-- homework_check: scores 0..10; homework_verse_score: 0..2
ALTER TABLE "homework_check" ADD CONSTRAINT "homework_check_test_score_range"
  CHECK ("test_score" IS NULL OR "test_score" BETWEEN 0 AND 10);
ALTER TABLE "homework_check" ADD CONSTRAINT "homework_check_notebook_score_range"
  CHECK ("notebook_score" IS NULL OR "notebook_score" BETWEEN 0 AND 10);
ALTER TABLE "homework_verse_score" ADD CONSTRAINT "homework_verse_score_range"
  CHECK ("score" BETWEEN 0 AND 2);

-- brick_ledger: zero quantity forbidden (БП-11); append-only is enforced by the repository (R-6)
ALTER TABLE "brick_ledger" ADD CONSTRAINT "brick_ledger_quantity_nonzero"
  CHECK ("quantity" <> 0);

-- penalty: one ACTIVE penalty per (pupil, lesson) (ШТ-4)
CREATE UNIQUE INDEX "penalty_one_active_per_pupil_lesson"
  ON "penalty" ("pupil_id", "lesson_id") WHERE "status" = 'ACTIVE';

-- family_adult: at most one MOTHER and one FATHER per family (СМ-3)
CREATE UNIQUE INDEX "family_adult_one_mother_or_father"
  ON "family_adult" ("family_id", "relation") WHERE "relation" IN ('MOTHER', 'FATHER');
