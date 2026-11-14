import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { ContentText } from "@/components/atoms/ContentText";
import { RatingTableMetricHeader } from "@/components/analytics/RatingTableMetricHeader";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import { RecordCard } from "@/components/patterns/RecordCard";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RatingTableRow } from "@/data/analytics/get-group-rating";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import type { GlossaryTerm } from "@/lib/messages/pick-glossary-messages";
import type { TeacherAchievementsMessages } from "@/lib/messages/teacher-achievements-messages";
import { cn } from "@/lib/utils";

type RatingTableProps = {
  rows: RatingTableRow[];
  messages: AnalyticsMessages["rating"];
  showGroupColumn?: boolean;
  metricGlossary: GlossaryTerm;
  termHintAriaLabel: string;
  achievementsUiEnabled?: boolean;
  achievementMessages?: TeacherAchievementsMessages;
};

const dash = "—";

export const RatingTable = ({
  rows,
  messages,
  showGroupColumn = false,
  metricGlossary,
  termHintAriaLabel,
  achievementsUiEnabled = false,
  achievementMessages,
}: RatingTableProps) => {
  if (rows.length === 0) {
    return <ContentText className="text-sm text-muted">{messages.empty}</ContentText>;
  }

  return (
    <>
      <ul className="flex flex-col gap-chip md:hidden" aria-label={messages.tableCaption}>
        {rows.map((row) => (
          <RecordCard
            cardType="analytics"
            key={row.pupilId}
            title={
              <span className="flex items-baseline gap-stack">
                <NumberDisplay className="font-display text-lg tabular-nums">
                  {row.place}
                </NumberDisplay>
                <CustomLink
                  href={`/analytics/pupils/${row.pupilId}`}
                  className="text-ink font-medium hover:text-cobalt-ink focus-visible:text-cobalt-ink"
                >
                  {row.displayName}
                </CustomLink>
              </span>
            }
            fields={[
              ...(showGroupColumn && row.groupName
                ? [{ label: messages.columnGroup, value: row.groupName }]
                : []),
              { label: messages.columnMetric, value: row.metric },
              ...(achievementsUiEnabled && achievementMessages
                ? [
                    {
                      label: achievementMessages.ratingColumnBonus,
                      value: row.achievementBonus ? `+${row.achievementBonus}` : dash,
                    },
                    {
                      label: achievementMessages.ratingColumnAwards,
                      value: row.awardsCount ? row.awardsCount : dash,
                    },
                    {
                      label: achievementMessages.ratingColumnPenalties,
                      value: row.penaltiesCount ? row.penaltiesCount : dash,
                    },
                  ]
                : []),
            ]}
          />
        ))}
      </ul>
      <Card className="hidden p-0 md:block">
        <Table className="text-base">
          <TableCaption className="sr-only">{messages.tableCaption}</TableCaption>
          <TableHeader className="border-line text-sm text-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-14 px-card py-chip font-normal">
                {messages.columnPlace}
              </TableHead>
              <TableHead scope="col" className="px-stack py-chip font-normal">
                {messages.columnPupil}
              </TableHead>
              {showGroupColumn ? (
                <TableHead scope="col" className="px-stack py-chip font-normal">
                  {messages.columnGroup}
                </TableHead>
              ) : null}
              <TableHead scope="col" className="px-stack py-chip text-right font-normal">
                <RatingTableMetricHeader
                  label={messages.columnMetric}
                  term={metricGlossary.term}
                  hint={metricGlossary.hint}
                  termHintAriaLabel={termHintAriaLabel}
                />
              </TableHead>
              {achievementsUiEnabled && achievementMessages ? (
                <>
                  <TableHead scope="col" className="px-stack py-chip text-right font-normal">
                    {achievementMessages.ratingColumnBonus}
                  </TableHead>
                  <TableHead scope="col" className="px-stack py-chip text-right font-normal">
                    {achievementMessages.ratingColumnAwards}
                  </TableHead>
                  <TableHead scope="col" className="px-card py-chip text-right font-normal">
                    {achievementMessages.ratingColumnPenalties}
                  </TableHead>
                </>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-line">
            {rows.map((row) => (
              <TableRow key={row.pupilId} className="h-14 hover:bg-transparent">
                <TableCell className="px-card py-chip">
                  <NumberDisplay className="font-display text-lg tabular-nums">
                    {row.place}
                  </NumberDisplay>
                </TableCell>
                <TableCell className="px-stack py-chip">
                  <CustomLink
                    href={`/analytics/pupils/${row.pupilId}`}
                    className="text-ink font-medium hover:text-cobalt-ink focus-visible:text-cobalt-ink"
                  >
                    {row.displayName}
                  </CustomLink>
                </TableCell>
                {showGroupColumn ? (
                  <TableCell className="px-stack py-chip text-sm text-ink-2">{row.groupName ?? dash}</TableCell>
                ) : null}
                <TableCell className="px-stack py-chip text-right tabular-nums">{row.metric}</TableCell>
                {achievementsUiEnabled && achievementMessages ? (
                  <>
                    <TableCell className="px-stack py-chip text-right tabular-nums text-muted">
                      {row.achievementBonus ? `+${row.achievementBonus}` : dash}
                    </TableCell>
                    <TableCell className="px-stack py-chip text-right tabular-nums">
                      {row.awardsCount ? row.awardsCount : dash}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-card py-chip text-right tabular-nums",
                        row.penaltiesCount ? "font-bold text-penalty" : "text-muted",
                      )}
                    >
                      {row.penaltiesCount ? row.penaltiesCount : dash}
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
};
