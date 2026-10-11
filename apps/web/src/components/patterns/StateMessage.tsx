import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Icon } from "@/components/atoms/Icon";
import { SectionTitle } from "@/components/atoms/SectionTitle";

export type StateMessageProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

type BaseProps = StateMessageProps & { icon: LucideIcon };

/** Shared centered layout for empty / error / forbidden states (UX-05). */
export const StateMessage = ({ icon, title, description, action }: BaseProps) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-4 py-10 text-center">
    <Icon icon={icon} className="size-8 text-muted" />
    <SectionTitle>{title}</SectionTitle>
    {description ? (
      <ContentText tone="secondary" className="max-w-prose">
        {description}
      </ContentText>
    ) : null}
    {action ? <div className="pt-1">{action}</div> : null}
  </div>
);
