import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const FormSection = ({ title, description, children }: FormSectionProps) => (
  <section className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
    <div className="space-y-1">
      <SectionTitle>{title}</SectionTitle>
      {description ? <ContentText tone="muted">{description}</ContentText> : null}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);
