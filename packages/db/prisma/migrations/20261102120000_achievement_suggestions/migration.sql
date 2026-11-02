-- CreateEnum
CREATE TYPE "achievement_suggestion_status_enum" AS ENUM ('SUGGESTED', 'CONFIRMED', 'DISMISSED');

-- AlterTable
ALTER TABLE "achievement" ADD COLUMN     "requires_confirmation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "achievement_suggestion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pupil_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "tier" INTEGER NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "award_key" TEXT NOT NULL,
    "evidence_check_ids" UUID[],
    "status" "achievement_suggestion_status_enum" NOT NULL DEFAULT 'SUGGESTED',
    "suggested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deferred_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "award_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievement_suggestion_award_key_key" ON "achievement_suggestion"("award_key");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_suggestion_award_id_key" ON "achievement_suggestion"("award_id");

-- CreateIndex
CREATE INDEX "achievement_suggestion_grade_id_academic_year_id_status_idx" ON "achievement_suggestion"("grade_id", "academic_year_id", "status");

-- CreateIndex
CREATE INDEX "achievement_suggestion_pupil_id_academic_year_id_status_idx" ON "achievement_suggestion"("pupil_id", "academic_year_id", "status");

-- AddForeignKey
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_pupil_id_fkey" FOREIGN KEY ("pupil_id") REFERENCES "pupil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "achievement_award"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CheckConstraints (ADR-016, database_schema_v1 §6)
ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_tier_check" CHECK ("tier" BETWEEN 1 AND 3);

ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_evidence_check" CHECK (cardinality("evidence_check_ids") >= 1);

ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_award_status_check" CHECK (("award_id" IS NOT NULL) = ("status" = 'CONFIRMED'));

ALTER TABLE "achievement_suggestion" ADD CONSTRAINT "achievement_suggestion_resolved_check" CHECK (("resolved_by" IS NOT NULL AND "resolved_at" IS NOT NULL) = ("status" <> 'SUGGESTED') AND ("resolved_by" IS NULL) = ("resolved_at" IS NULL));

-- DataFix: series «Хранитель слова» requires teacher confirmation
UPDATE "achievement" SET "requires_confirmation" = true WHERE "code" = 'verses';
