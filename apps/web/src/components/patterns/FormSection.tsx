import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const FormSection = ({ title, description, children }: FormSectionProps) => (
  <section className="flex flex-col gap-stack rounded-xl border border-line bg-surface p-card">
    <div className="flex flex-col gap-hint">
      <SectionTitle>{title}</SectionTitle>
      {description ? <ContentText tone="muted">{description}</ContentText> : null}
    </div>
    <div className="flex flex-col gap-stack">{children}</div>
  </section>
);
