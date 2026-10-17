import { ContentText } from "@/components/atoms/ContentText";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { LedgerList } from "@/components/teacher/LedgerList";
import type { BrickLedgerEntryDto } from "@/data/bricks/bricks-shared.server";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";

type BricksLedgerPanelProps = {
  pupilName: string | null;
  ledger: readonly BrickLedgerEntryDto[];
  messages: TeacherBricksMessages;
};

export const BricksLedgerPanel = ({ pupilName, ledger, messages }: BricksLedgerPanelProps) => (
  <section className="space-y-3">
    <SectionTitle>
      {pupilName ? messages.ledgerTitle(pupilName) : messages.ledgerSelectPupil}
    </SectionTitle>
    {pupilName ? (
      <LedgerList entries={ledger} messages={messages} />
    ) : (
      <ContentText className="text-muted-foreground">{messages.ledgerSelectPupil}</ContentText>
    )}
  </section>
);
