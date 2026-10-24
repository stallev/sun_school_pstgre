-- CreateTable
CREATE TABLE "grade_achievement_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_settings_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "tier" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grade_achievement_points_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grade_achievement_points_tier_check" CHECK ("tier" BETWEEN 0 AND 3)
);

-- CreateIndex
CREATE UNIQUE INDEX "grade_achievement_points_grade_settings_id_achievement_id_tier_key" ON "grade_achievement_points"("grade_settings_id", "achievement_id", "tier");

-- AddForeignKey
ALTER TABLE "grade_achievement_points" ADD CONSTRAINT "grade_achievement_points_grade_settings_id_fkey" FOREIGN KEY ("grade_settings_id") REFERENCES "grade_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_achievement_points" ADD CONSTRAINT "grade_achievement_points_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
