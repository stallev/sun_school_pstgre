-- CreateIndex
CREATE UNIQUE INDEX "weekly_digest_user_id_period_start_key" ON "weekly_digest"("user_id", "period_start");
