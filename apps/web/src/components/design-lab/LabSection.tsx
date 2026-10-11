import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";

type LabSectionProps = {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
};

export const LabSection = ({ id, title, hint, children }: LabSectionProps) => (
  <section id={id} className="scroll-mt-20 space-y-4">
    <div className="space-y-1">
      <SectionTitle>{title}</SectionTitle>
      {hint ? <ContentText tone="muted">{hint}</ContentText> : null}
    </div>
    {children}
  </section>
);
