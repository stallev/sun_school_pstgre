import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import type { GuideStep } from "@/lib/guide/guide-content-types";

type GuideStepLineProps = {
  step: GuideStep;
};

export const GuideStepLine = ({ step }: GuideStepLineProps) => (
  <ContentText>
    {step.text}
    {step.link ? (
      <>
        <CustomLink href={step.link.href} className="font-medium">
          {step.link.label}
        </CustomLink>
        {step.textAfter ?? ""}
      </>
    ) : (
      (step.textAfter ?? "")
    )}
  </ContentText>
);
