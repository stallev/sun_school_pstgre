import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Card } from "@/components/ui/card";
import type { ParentDigestView } from "@/data/families/load-parent-child-page.server";
import type { ParentMessages } from "@/lib/messages/parent-messages";

type ParentWeeklyDigestCardProps = {
  digest: ParentDigestView | null;
  messages: ParentMessages;
};

export const ParentWeeklyDigestCard = ({ digest, messages }: ParentWeeklyDigestCardProps) => {
  const empty =
    !digest ||
    (digest.awardCount === 0 && digest.penaltyCount === 0 && digest.lateCount === 0);

  return (
    <Card className="p-4">
      <SectionTitle as="h2">{messages.child.digestTitle}</SectionTitle>
      {empty ? (
        <ContentText className="mt-2 text-sm text-muted">{messages.child.digestEmpty}</ContentText>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-ink-2">
          {digest.awardCount > 0 ? (
            <li>
              {messages.child.digestAward}: {digest.awardCount}
            </li>
          ) : null}
          {digest.penaltyCount > 0 ? (
            <li>
              {messages.child.digestPenalty}: {digest.penaltyCount}
            </li>
          ) : null}
          {digest.lateCount > 0 ? (
            <li>
              {messages.child.digestLate}: {digest.lateCount}
            </li>
          ) : null}
        </ul>
      )}
    </Card>
  );
};
