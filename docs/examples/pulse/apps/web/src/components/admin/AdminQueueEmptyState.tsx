import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export type AdminQueueEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: "success" | "neutral";
  action?: {
    href: string;
    label: string;
  };
  className?: string;
};

export function AdminQueueEmptyState({
  icon: Icon,
  title,
  description,
  variant = "neutral",
  action,
  className,
}: AdminQueueEmptyStateProps) {
  return (
    <Empty
      className={cn(
        "mt-6 border-border bg-card md:col-span-2 xl:col-span-3",
        variant === "success" && "border-[hsl(var(--color-success-container))]/40",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon
            aria-hidden
            className={cn(
              variant === "success" && "text-[hsl(var(--color-success))]",
            )}
          />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? (
        <EmptyContent>
          <Button asChild variant="outline">
            <CustomLink href={action.href}>{action.label}</CustomLink>
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
