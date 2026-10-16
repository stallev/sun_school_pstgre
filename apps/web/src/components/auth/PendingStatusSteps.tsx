import { CheckCircle2Icon, ClockIcon, LogInIcon, ShieldCheckIcon } from "lucide-react";
import { ContentText } from "@/components/atoms";

type PendingStatusStepsProps = {
  stepSignIn: string;
  stepConsent: string;
  stepConsentVersion?: string | null;
  stepReview: string;
  stepAfterApprove: string;
};

const stepRowClass = "flex gap-3 border-b border-line py-3 last:border-b-0";

export const PendingStatusSteps = ({
  stepSignIn,
  stepConsent,
  stepConsentVersion,
  stepReview,
  stepAfterApprove,
}: PendingStatusStepsProps) => {
  const consentText = stepConsentVersion ? `${stepConsent} (${stepConsentVersion})` : stepConsent;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className={stepRowClass}>
        <LogInIcon className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
        <ContentText className="text-ink-2">{stepSignIn}</ContentText>
      </div>
      <div className={stepRowClass}>
        <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
        <ContentText className="text-ink-2">{consentText}</ContentText>
      </div>
      <div className={stepRowClass}>
        <ClockIcon className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
        <ContentText className="text-ink-2">{stepReview}</ContentText>
      </div>
      <div className={stepRowClass}>
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-ink-2" aria-hidden />
        <ContentText className="text-ink-2">{stepAfterApprove}</ContentText>
      </div>
    </div>
  );
};
