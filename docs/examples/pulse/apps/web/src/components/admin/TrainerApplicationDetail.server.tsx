import { TrainerApplicationDecisionBar } from "@/components/admin/TrainerApplicationDecisionBar";
import { TrainerApplicationDetailHeader } from "@/components/admin/TrainerApplicationDetailHeader";
import { TrainerApplicationDocumentsCard } from "@/components/admin/TrainerApplicationDocumentsCard";
import { TrainerApplicationIncompleteAlert } from "@/components/admin/TrainerApplicationIncompleteAlert";
import { TrainerApplicationProcessedBanner } from "@/components/admin/TrainerApplicationProcessedBanner";
import { TrainerApplicationProfileCard } from "@/components/admin/TrainerApplicationProfileCard";
import { TrainerApplicationServicesSection } from "@/components/admin/TrainerApplicationServicesSection";
import { requireTrainerApplication } from "@/data/admin/get-trainer-application.server";
import { isTrainerApplicationIncomplete } from "@/lib/admin/is-trainer-application-incomplete";
import { cn } from "@/lib/utils";

export type TrainerApplicationDetailProps = {
  params: Promise<{ id: string }>;
};

export async function TrainerApplicationDetail({
  params,
}: TrainerApplicationDetailProps) {
  const { id } = await params;
  const application = await requireTrainerApplication(id);
  const isIncomplete = isTrainerApplicationIncomplete(application);

  return (
    <div
      className={cn("space-y-6", application.canModerate && "pb-24 md:pb-0")}
    >
      <TrainerApplicationDetailHeader />

      {application.canModerate && isIncomplete ? (
        <TrainerApplicationIncompleteAlert />
      ) : null}

      {!application.canModerate ? (
        <TrainerApplicationProcessedBanner
          status={application.status}
          rejectionReason={application.rejectionReason}
        />
      ) : null}

      <TrainerApplicationProfileCard application={application} />

      <TrainerApplicationDocumentsCard
        certificates={application.certificates}
        verificationDocuments={application.verificationDocuments}
      />

      {application.services.length > 0 ? (
        <TrainerApplicationServicesSection services={application.services} />
      ) : null}

      {application.canModerate ? (
        <TrainerApplicationDecisionBar trainerProfileId={application.id} />
      ) : null}
    </div>
  );
}
