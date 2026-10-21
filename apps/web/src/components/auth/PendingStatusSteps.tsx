import { CheckCircle2Icon, CircleIcon, KeyRoundIcon } from "lucide-react";
import { ContentText } from "@/components/atoms";

type PendingStatusStepsProps = {
  stepSignIn: string;
  stepConsent: string;
  stepConsentVersion?: string | null;
  stepReview: string;
  stepAfterApprove: string;
};

const stepIconClass = "mt-0.5 size-5 shrink-0";

export const PendingStatusSteps = ({
  stepSignIn,
  stepConsent,
  stepConsentVersion,
  stepReview,
  stepAfterApprove,
}: PendingStatusStepsProps) => {
  const steps = [
    { icon: CheckCircle2Icon, iconClass: `${stepIconClass} text-ok`, title: stepSignIn, detail: null },
    {
      icon: CheckCircle2Icon,
      iconClass: `${stepIconClass} text-ok`,
      title: stepConsent,
      detail: stepConsentVersion ?? null,
    },
    { icon: KeyRoundIcon, iconClass: `${stepIconClass} text-cobalt-ink`, title: stepReview, detail: null },
    { icon: CircleIcon, iconClass: `${stepIconClass} text-muted`, title: stepAfterApprove, detail: null },
  ];

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <ol className="space-y-5">
        {steps.map((step) => (
          <li key={step.title} className="flex gap-4">
            <step.icon className={step.iconClass} aria-hidden />
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium text-ink">{step.title}</p>
              {step.detail ? <ContentText tone="secondary">{step.detail}</ContentText> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
