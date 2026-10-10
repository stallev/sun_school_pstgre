import type { LucideIcon } from "lucide-react";
import {
  ActivityIcon,
  DumbbellIcon,
  FlameIcon,
  StretchHorizontalIcon,
  TargetIcon,
} from "lucide-react";

import { ContentText, SectionTitle } from "@/components/atoms";
import { CustomLink } from "@/components/ui/CustomLink";

import { getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cardio: ActivityIcon,
  pilates: TargetIcon,
  strength: DumbbellIcon,
  hiit: FlameIcon,
  stretching: StretchHorizontalIcon,
};

export async function ClientDashboardCategories() {
  const messages = await getMessages();
  return (
    <section className="min-w-0 space-y-3">
      <SectionTitle as="h2" className="mx-0 max-w-none text-left text-base">
        {messages.dashboard.client.categoriesTitle}
      </SectionTitle>
      <div className="grid min-w-0 grid-cols-3 gap-2.5 lg:grid-cols-2">
        {messages.landing.categories.items.map((item) => {
          const Icon = CATEGORY_ICONS[item.slug] ?? ActivityIcon;

          return (
            <CustomLink
              key={item.slug}
              href={`/trainers?specializations=${item.slug}`}
              className={cn(
                "group flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-2 text-center shadow-sm",
                "transition-[transform,background-color,border-color,box-shadow] duration-200",
                "hover:border-primary/25 hover:bg-primary-container/35 hover:shadow-md",
                "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-container text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-4" aria-hidden strokeWidth={1.75} />
              </span>
              <ContentText
                as="span"
                className="line-clamp-2 text-[11px] leading-tight font-medium text-foreground"
              >
                {item.label}
              </ContentText>
            </CustomLink>
          );
        })}
      </div>
    </section>
  );
}
