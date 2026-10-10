import { ArrowRightIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/CustomLink";
import { cn } from "@/lib/utils";

type FeatureItem = {
  title: string;
  description: string;
  href: string | null;
  linkLabel: string | null;
  status: string;
};

export type FeatureCardGridProps = {
  items: readonly FeatureItem[];
  statusLabels: {
    live: string;
    stub: string;
  };
};

export function FeatureCardGrid({ items, statusLabels }: FeatureCardGridProps) {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <PulseCard key={item.title} variant="base" className="flex h-full flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <ContentText as="p" variant="blockLabel" className="font-semibold text-foreground">
              {item.title}
            </ContentText>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                item.status === "live"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.status === "live" ? statusLabels.live : statusLabels.stub}
            </span>
          </div>
          <ContentText as="p" variant="muted" className="mb-4 flex-1 text-sm leading-relaxed">
            {item.description}
          </ContentText>
          {item.href && item.linkLabel ? (
            <CustomLink
              href={item.href}
              variant="quiet"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              {item.linkLabel}
              <ArrowRightIcon aria-hidden className="size-3.5" />
            </CustomLink>
          ) : null}
        </PulseCard>
      ))}
    </div>
  );
}
