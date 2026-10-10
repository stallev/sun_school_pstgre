import {
  ChevronRightIcon,
  FlagIcon,
  RefreshCwIcon,
  ShieldIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { CustomLink } from "@/components/ui/CustomLink";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AdminNeedsAttentionItem = {
  href: string;
  title: string;
  detail?: string;
  count: number;
  icon: LucideIcon;
};

export type AdminNeedsAttentionCardProps = {
  items: AdminNeedsAttentionItem[];
};

const ICON_BY_HREF: Record<string, LucideIcon> = {
  "/admin/trainers": ShieldIcon,
  "/admin/complaints": FlagIcon,
  "/admin/refunds": RefreshCwIcon,
};

export function resolveNeedsAttentionIcon(href: string): LucideIcon {
  return ICON_BY_HREF[href] ?? FlagIcon;
}

export function AdminNeedsAttentionCard({ items }: AdminNeedsAttentionCardProps) {
  return (
    <PulseCard variant="base" className="rounded-2xl">
      <PulseCardContent density="sm" className="p-0">
        <ul>
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.href}
                className={cn(index > 0 && "border-t border-border")}
              >
                <CustomLink
                  href={item.href}
                  className="flex items-center gap-3 p-4 hover:bg-muted/40"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <ContentText as="p" className="font-medium">
                      {item.title}
                    </ContentText>
                    {item.detail ? (
                      <ContentText
                        as="p"
                        className="text-sm text-muted-foreground"
                      >
                        {item.detail}
                      </ContentText>
                    ) : null}
                  </div>
                  <ContentText
                    as="span"
                    className="shrink-0 text-lg font-semibold tabular-nums"
                  >
                    {item.count}
                  </ContentText>
                  <ChevronRightIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </CustomLink>
              </li>
            );
          })}
        </ul>
      </PulseCardContent>
    </PulseCard>
  );
}
