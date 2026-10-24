import { ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import { StatusText } from "@/components/ui/status-text";
import type { SchoolAttentionItem } from "@/data/analytics/load-school-analytics-page.server";
import { plural } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SchoolAttentionListProps = {
  items: SchoolAttentionItem[];
  messages: AnalyticsMessages["school"];
  locale: MessageLocale;
};

export const SchoolAttentionList = ({ items, messages, locale }: SchoolAttentionListProps) => {
  if (items.length === 0) return null;

  return (
    <section className="mt-8 space-y-2 lg:space-y-3">
      <SectionTitle as="h2" className="mb-3 text-lg">{messages.attentionTitle}</SectionTitle>
      <Card className="divide-y divide-line overflow-hidden p-0">
        <ul>
          {items.map((item) => {
            const title =
              item.kind === "pending_access"
                ? plural(messages.attentionPendingUsers, item.count, locale)
                : fillMessage(messages.attentionNegativeBricks, { count: item.count });
            const description =
              item.kind === "pending_access"
                ? messages.attentionPendingHint
                : messages.attentionNegativeBricksHint;
            const tone = item.tone === "danger" ? "danger" : "warn";
            return (
              <li key={item.kind}>
                <CustomLink
                  href={item.href}
                  className="flex w-full items-center gap-2 px-3 py-3 text-left hover:bg-paper/70"
                >
                  <span className="min-w-0 flex-1">
                    <StatusText tone={tone} className="block text-[1.3125rem] leading-snug">
                      {title}
                    </StatusText>
                    <ContentText className="mt-1 block text-base text-muted-foreground">
                      {description}
                    </ContentText>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </CustomLink>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
};
