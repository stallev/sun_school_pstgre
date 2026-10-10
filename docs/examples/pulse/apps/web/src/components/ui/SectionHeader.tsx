import { ChevronRightIcon } from "lucide-react";

import { Heading } from "@/components/atoms";
import { CustomLink } from "@/components/ui/CustomLink";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function SectionHeader({
  title,
  actionHref,
  actionLabel = "All",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <Heading as="h2" visualLevel="h2">
        {title}
      </Heading>
      {actionHref ? (
        <CustomLink href={actionHref} className="inline-flex items-center gap-0.5">
          {actionLabel}
          <ChevronRightIcon aria-hidden className="size-3.5" />
        </CustomLink>
      ) : null}
    </div>
  );
}
