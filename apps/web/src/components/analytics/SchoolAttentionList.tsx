import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import type { SchoolAttentionItem } from "@/data/analytics/load-school-analytics-page.server";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type SchoolAttentionListProps = {
  items: SchoolAttentionItem[];
  messages: AnalyticsMessages["school"];
};

export const SchoolAttentionList = ({ items, messages }: SchoolAttentionListProps) => {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionTitle as="h2" className="text-lg">{messages.attentionTitle}</SectionTitle>
      <Card className="divide-y divide-line p-0">
        <ul>
          {items.map((item) => {
            const title =
              item.kind === "pending_access"
                ? messages.attentionPending(item.count)
                : messages.attentionNegativeBricks(item.count);
            const description =
              item.kind === "pending_access"
                ? messages.attentionPendingHint
                : messages.attentionNegativeBricksHint;
            const toneClass =
              item.tone === "danger" ? "text-danger" : "text-warn";
            return (
              <li key={item.kind}>
                <CustomLink
                  href={item.href}
                  className="flex w-full flex-col gap-1 px-5 py-4 hover:bg-paper"
                >
                  <ContentText className={`font-medium ${toneClass}`}>{title}</ContentText>
                  <ContentText className="text-sm text-muted-foreground">{description}</ContentText>
                </CustomLink>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
};
