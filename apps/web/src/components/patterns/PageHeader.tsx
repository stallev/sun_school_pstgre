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
  <header className="@container mb-3 lg:mb-4">
    <div className="flex flex-wrap items-end justify-between gap-chip">
      <div className="min-w-0 basis-full space-y-1 @[960px]:flex-1 @[960px]:basis-0">
        <Heading>{title}</Heading>
        {description ? <ContentText tone="secondary">{description}</ContentText> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap gap-chip">{actions}</div> : null}
    </div>
  </header>
);
