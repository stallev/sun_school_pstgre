import { Button } from "@/components/ui/button";
import { StatusText } from "@/components/ui/status-text";
import { RecordCard } from "@/components/patterns/RecordCard";
import type { BricksBalanceRow } from "@/data/bricks/load-bricks-page.server";
import { BricksEarnedBonusLine } from "@/lib/achievements/format-bricks-bonus-line";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";
import { cn } from "@/lib/utils";

type BalanceCardsProps = {
  rows: readonly BricksBalanceRow[];
  selectedPupilId: string | null;
  messages: TeacherBricksMessages;
  achievementMessages?: TeacherAchievementsMessages;
  onSelectPupil: (pupilId: string) => void;
  onIssue: (pupilId: string) => void;
  onCompensate: (pupilId: string) => void;
};

export const BalanceCards = ({
  rows,
  selectedPupilId,
  messages,
  achievementMessages,
  onSelectPupil,
  onIssue,
  onCompensate,
}: BalanceCardsProps) => (
  <ul className="space-y-3 lg:hidden" aria-label={messages.columnPupil}>
    {rows.map((row) => {
      const isSelected = row.pupilId === selectedPupilId;
      return (
        <RecordCard
          key={row.pupilId}
          selected={isSelected}
          className={cn(row.balance < 0 && "ring-1 ring-inset ring-danger/40")}
          title={
            <button
              type="button"
              className="min-h-11 text-left text-cobalt-ink underline-offset-2 hover:underline"
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelectPupil(row.pupilId)}
            >
              {row.displayName}
            </button>
          }
          fields={[
            { label: messages.columnEarned, value: <span className="font-bold tabular-nums">{row.earned}</span> },
            { label: messages.columnIssued, value: <span className="font-bold tabular-nums">{row.issued}</span> },
            {
              label: messages.columnBalance,
              value: (
                <span className={cn("font-bold tabular-nums", row.balance < 0 && "text-danger")}>
                  {row.balance}
                </span>
              ),
            },
          ]}
          note={
            <>
              {row.needsAttention ? (
                <StatusText tone="warn">{messages.needsAttention}</StatusText>
              ) : null}
              {row.achievementsUiEnabled && achievementMessages ? (
                <BricksEarnedBonusLine
                  bonus={row.achievementBonus}
                  penalties={row.penaltiesTotal}
                  messages={achievementMessages}
                />
              ) : null}
            </>
          }
          actions={
            <>
              <Button type="button" size="sm" className="min-h-11" onClick={() => onIssue(row.pupilId)}>
                {messages.actionIssue}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11"
                onClick={() => onCompensate(row.pupilId)}
              >
                {messages.actionCompensate}
              </Button>
            </>
          }
        />
      );
    })}
  </ul>
);
