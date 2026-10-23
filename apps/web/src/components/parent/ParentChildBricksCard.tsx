import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Card } from "@/components/ui/card";
import type { ParentMessages } from "@/lib/messages/parent-messages";

type ParentChildBricksCardProps = {
  bricks: { earned: number; issued: number; pending: number };
  messages: ParentMessages;
};

export const ParentChildBricksCard = ({ bricks, messages }: ParentChildBricksCardProps) => (
  <Card className="p-4">
    <SectionTitle as="h2">{messages.child.bricksTitle}</SectionTitle>
    <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
      <div>
        <dt className="text-xs text-muted">{messages.child.bricksEarned}</dt>
        <dd className="mt-1">
          <NumberDisplay>{bricks.earned}</NumberDisplay>
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">{messages.child.bricksIssued}</dt>
        <dd className="mt-1">
          <NumberDisplay>{bricks.issued}</NumberDisplay>
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">{messages.child.bricksPending}</dt>
        <dd className="mt-1">
          <NumberDisplay>{bricks.pending}</NumberDisplay>
        </dd>
      </div>
    </dl>
  </Card>
);
