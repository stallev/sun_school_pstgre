import { SectionTitle } from "@/components/atoms/SectionTitle";
import { GuideStepLine } from "@/components/guide/GuideStepLine";
import type { GuideSection } from "@/lib/guide/guide-content-types";

type GuideSectionBlockProps = {
  section: GuideSection;
};

export const GuideSectionBlock = ({ section }: GuideSectionBlockProps) => (
  <section id={section.id} className="scroll-mt-24 space-y-3">
    <SectionTitle as="h2">{section.title}</SectionTitle>
    <ol className="list-decimal space-y-2 pl-5">
      {section.steps.map((step, index) => (
        <li key={`${section.id}-${index}`}>
          <GuideStepLine step={step} />
        </li>
      ))}
    </ol>
  </section>
);
