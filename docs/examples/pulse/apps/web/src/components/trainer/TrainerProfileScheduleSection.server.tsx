import { getTrainerSchedulePreview } from "@/data/trainer/get-trainer-schedule-preview.server";
import { TrainerSchedulePreviewPanel } from "@/components/trainer/TrainerSchedulePreviewPanel";

export type TrainerProfileScheduleSectionProps = {
  trainerProfileId: string;
  slotDurationMinutes: number;
};

export async function TrainerProfileScheduleSection({
  trainerProfileId,
  slotDurationMinutes,
}: TrainerProfileScheduleSectionProps) {
  const preview = await getTrainerSchedulePreview(
    trainerProfileId,
    slotDurationMinutes,
  );

  if (!preview) {
    return null;
  }

  return <TrainerSchedulePreviewPanel preview={preview} />;
}
