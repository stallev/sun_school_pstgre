-- P08 §5.7: analytics year snapshots (R-10, R-11; INV-26)

CREATE TYPE "analytics_snapshot_reason_enum" AS ENUM ('CLOSE', 'CORRECTION', 'ERASURE', 'BACKFILL');

CREATE TABLE "analytics_group_year_snapshot" (
  "grade_id" UUID NOT NULL,
  "academic_year_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "kids" INTEGER NOT NULL,
  "lessons" INTEGER NOT NULL,
  "attendance" DECIMAL(6, 5),
  "verses" DECIMAL(4, 2),
  "test" DECIMAL(5, 1),
  "notebook" DECIMAL(5, 1),
  "methodology_version" TEXT NOT NULL,
  "reason" "analytics_snapshot_reason_enum" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analytics_group_year_snapshot_pkey" PRIMARY KEY ("grade_id", "academic_year_id", "version")
);

CREATE TABLE "analytics_pupil_year_snapshot" (
  "pupil_id" UUID NOT NULL,
  "academic_year_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "grade_ids" UUID[] NOT NULL,
  "lessons" INTEGER NOT NULL,
  "attendance" DECIMAL(6, 5),
  "verses" DECIMAL(4, 2),
  "test" DECIMAL(5, 1),
  "notebook" DECIMAL(5, 1),
  "bricks_earned" INTEGER NOT NULL,
  "methodology_version" TEXT NOT NULL,
  "reason" "analytics_snapshot_reason_enum" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analytics_pupil_year_snapshot_pkey" PRIMARY KEY ("pupil_id", "academic_year_id", "version")
);

CREATE INDEX "analytics_group_year_snapshot_academic_year_id_idx"
  ON "analytics_group_year_snapshot" ("academic_year_id");

CREATE INDEX "analytics_pupil_year_snapshot_academic_year_id_idx"
  ON "analytics_pupil_year_snapshot" ("academic_year_id");

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_grade_id_fkey"
  FOREIGN KEY ("grade_id") REFERENCES "grade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_academic_year_id_fkey"
  FOREIGN KEY ("academic_year_id") REFERENCES "academic_year" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_pupil_id_fkey"
  FOREIGN KEY ("pupil_id") REFERENCES "pupil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_academic_year_id_fkey"
  FOREIGN KEY ("academic_year_id") REFERENCES "academic_year" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_version_check" CHECK ("version" >= 1);

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_kids_check" CHECK ("kids" >= 0);

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_lessons_check" CHECK ("lessons" >= 0);

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_attendance_check"
  CHECK ("attendance" IS NULL OR ("attendance" >= 0 AND "attendance" <= 1));

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_verses_check"
  CHECK ("verses" IS NULL OR ("verses" >= 0 AND "verses" <= 3));

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_test_check"
  CHECK ("test" IS NULL OR ("test" >= 0 AND "test" <= 10));

ALTER TABLE "analytics_group_year_snapshot"
  ADD CONSTRAINT "analytics_group_year_snapshot_notebook_check"
  CHECK ("notebook" IS NULL OR ("notebook" >= 0 AND "notebook" <= 10));

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_version_check" CHECK ("version" >= 1);

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_lessons_check" CHECK ("lessons" >= 0);

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_bricks_earned_check" CHECK ("bricks_earned" >= 0);

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_grade_ids_check"
  CHECK (cardinality("grade_ids") >= 1);

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_attendance_check"
  CHECK ("attendance" IS NULL OR ("attendance" >= 0 AND "attendance" <= 1));

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_verses_check"
  CHECK ("verses" IS NULL OR ("verses" >= 0 AND "verses" <= 3));

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_test_check"
  CHECK ("test" IS NULL OR ("test" >= 0 AND "test" <= 10));

ALTER TABLE "analytics_pupil_year_snapshot"
  ADD CONSTRAINT "analytics_pupil_year_snapshot_notebook_check"
  CHECK ("notebook" IS NULL OR ("notebook" >= 0 AND "notebook" <= 10));
