import type { ReactNode } from "react";
import { ContentText } from "@/components/atoms/ContentText";
import { Heading } from "@/components/atoms/Heading";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons); wraps under the title on narrow screens. */
  actions?: ReactNode;
};

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 space-y-1">
      <Heading>{title}</Heading>
      {description ? <ContentText tone="secondary">{description}</ContentText> : null}
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
  </header>
);
