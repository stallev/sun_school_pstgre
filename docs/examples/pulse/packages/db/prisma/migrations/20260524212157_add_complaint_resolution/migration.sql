-- CreateEnum
CREATE TYPE "complaint_resolution" AS ENUM ('no_action', 'warning_to_trainer', 'refund_recommended', 'duplicate', 'spam');

-- AlterTable
ALTER TABLE "complaint" ADD COLUMN     "resolution" "complaint_resolution";
