import { ApproveTrainerButton } from "@/components/admin/ApproveTrainerButton.client";
import { RejectTrainerDialog } from "@/components/admin/RejectTrainerDialog.client";

export type TrainerApplicationDecisionBarProps = {
  trainerProfileId: string;
};

export function TrainerApplicationDecisionBar({
  trainerProfileId,
}: TrainerApplicationDecisionBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <div className="flex flex-wrap gap-2 [&_button]:min-h-11">
        <RejectTrainerDialog trainerProfileId={trainerProfileId} />
        <ApproveTrainerButton trainerProfileId={trainerProfileId} />
      </div>
    </div>
  );
}
