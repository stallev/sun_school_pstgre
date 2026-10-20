import { SAMPLE_LAYER } from "@sunschool/domain";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GroupAnalyticsSnapshot, GroupAnalyticsPupilRow } from "@/data/analytics/analytics-compute.server";
import { buildBirthYearCohortRows } from "@/lib/analytics/build-birth-year-cohort-rows";
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type GroupAnalyticsTablesProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
  locale: string;
};

type TableVariant = "layer-a" | "layer-b" | "layer-c" | "layer-d";

const formatScore = (average: number | null, n: number, messages: AnalyticsMessages): string => {
  if (average === null || n === 0) return messages.kpiEmpty;
  return fillMessage(messages.kpiWithN, {
    value: formatAnalyticsAverage(messages.formatAverage, Number(average.toFixed(1))),
    n,
  });
};

const PupilLayerTable = ({
  title,
  intro,
  rows,
  messages,
  variant,
  locale,
}: {
  title: string;
  intro?: string;
  rows: GroupAnalyticsPupilRow[];
  messages: AnalyticsMessages;
  variant: TableVariant;
  locale: string;
}) => (
  <section className="min-w-0 space-y-2">
    <SectionTitle as="h2" className="text-lg">{title}</SectionTitle>
    {intro ? <ContentText className="text-sm text-ink-2">{intro}</ContentText> : null}
    {rows.length === 0 ? (
      <ContentText className="text-sm text-muted-foreground">{messages.tables.emptySection}</ContentText>
    ) : (
      <Card className="max-w-full overflow-x-auto p-0">
        <Table className="min-w-[20rem] text-base">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{messages.tables.columnName}</TableHead>
              {variant !== "layer-d" ? (
                <TableHead scope="col">{messages.tables.columnBirthYear}</TableHead>
              ) : null}
              {variant === "layer-a" ? (
                <>
                  <TableHead scope="col">{messages.tables.columnAttendance}</TableHead>
                  <TableHead scope="col">{messages.tables.columnAttendedChecked}</TableHead>
                  <TableHead scope="col">{messages.tables.columnVerses}</TableHead>
                  <TableHead scope="col">{messages.tables.columnTest}</TableHead>
                  <TableHead scope="col">{messages.tables.columnNotebook}</TableHead>
                </>
              ) : null}
              {variant === "layer-b" ? (
                <>
                  <TableHead scope="col">{messages.tables.columnAttended}</TableHead>
                  <TableHead scope="col">{messages.tables.columnCheckedLessons}</TableHead>
                  <TableHead scope="col">{messages.tables.columnAttendance}</TableHead>
                </>
              ) : null}
              {variant === "layer-d" ? (
                <TableHead scope="col">{messages.tables.columnEnrolledSince}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.pupilId}>
                <TableCell>
                  <CustomLink href={`/analytics/pupils/${row.pupilId}`}>{row.displayName}</CustomLink>
                </TableCell>
                {variant !== "layer-d" ? (
                  <TableCell>{row.birthYear ?? messages.kpiEmpty}</TableCell>
                ) : null}
                {variant === "layer-a" ? (
                  <>
                    <TableCell>
                      {row.attendanceRate === null
                        ? messages.kpiEmpty
                        : formatAnalyticsPercent(
                            messages.formatPercent,
                            Number(row.attendanceRate.toFixed(1)),
                          )}
                    </TableCell>
                    <TableCell>
                      {fillMessage(messages.tables.attendedCheckedValue, {
                        attended: row.attendedLessonCount,
                        checked: row.checkedLessonCount,
                      })}
                    </TableCell>
                    <TableCell>{formatScore(row.versesAverage.average, row.versesAverage.observationCount, messages)}</TableCell>
                    <TableCell>{formatScore(row.testAverage.average, row.testAverage.observationCount, messages)}</TableCell>
                    <TableCell>{formatScore(row.notebookAverage.average, row.notebookAverage.observationCount, messages)}</TableCell>
                  </>
                ) : null}
                {variant === "layer-b" ? (
                  <>
                    <TableCell>{row.attendedLessonCount}</TableCell>
                    <TableCell>{row.checkedLessonCount}</TableCell>
                    <TableCell>
                      {row.attendanceRate === null
                        ? messages.kpiEmpty
                        : formatAnalyticsPercent(
                            messages.formatPercent,
                            Number(row.attendanceRate.toFixed(1)),
                          )}
                    </TableCell>
                  </>
                ) : null}
                {variant === "layer-d" ? (
                  <TableCell>
                    {formatAnalyticsShortDate(row.enrolledSinceIso, locale)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )}
  </section>
);

export const GroupAnalyticsTables = ({ snapshot, messages, locale }: GroupAnalyticsTablesProps) => {
  const layerA = snapshot.pupilsByLayer[SAMPLE_LAYER.A];
  const layerB = snapshot.pupilsByLayer[SAMPLE_LAYER.B];
  const layerC = snapshot.pupilsByLayer[SAMPLE_LAYER.C];
  const layerD = snapshot.pupilsByLayer[SAMPLE_LAYER.D];
  const birthYearRows = buildBirthYearCohortRows(layerA);

  return (
    <div className="min-w-0 space-y-6">
      <PupilLayerTable
        title={messages.tables.layerATitle}
        rows={layerA}
        messages={messages}
        variant="layer-a"
        locale={locale}
      />
      <PupilLayerTable
        title={messages.tables.layerBTitle}
        intro={messages.tables.layerBIntro}
        rows={layerB}
        messages={messages}
        variant="layer-b"
        locale={locale}
      />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <PupilLayerTable
          title={messages.tables.layerCTitle}
          rows={layerC}
          messages={messages}
          variant="layer-c"
          locale={locale}
        />
        <PupilLayerTable
          title={messages.tables.layerDTitle}
          rows={layerD}
          messages={messages}
          variant="layer-d"
          locale={locale}
        />
      </div>
      <section className="min-w-0 space-y-2">
        <SectionTitle as="h2" className="text-lg">{messages.tables.layerBirthYearTitle}</SectionTitle>
        <ContentText className="text-sm text-ink-2">{messages.tables.layerBirthYearNote}</ContentText>
        {birthYearRows.length === 0 ? (
          <ContentText className="text-sm text-muted-foreground">{messages.tables.emptySection}</ContentText>
        ) : (
          <Card className="max-w-full overflow-x-auto p-0">
            <Table className="min-w-[20rem] text-base">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{messages.tables.columnBirthYear}</TableHead>
                  <TableHead scope="col" className="text-right">{messages.tables.columnBirthYearKids}</TableHead>
                  <TableHead scope="col" className="text-right">{messages.tables.columnAttendance}</TableHead>
                  <TableHead scope="col" className="text-right">{messages.tables.columnVerses}</TableHead>
                  <TableHead scope="col" className="text-right">{messages.tables.columnTest}</TableHead>
                  <TableHead scope="col" className="text-right">{messages.tables.columnNotebook}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {birthYearRows.map((row) => (
                  <TableRow key={row.birthYear ?? "unknown"}>
                    <TableCell>{row.birthYear ?? messages.kpiEmpty}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.pupilCount}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.attendancePercent === null
                        ? messages.kpiEmpty
                        : formatAnalyticsPercent(
                            messages.formatPercent,
                            Number(row.attendancePercent.toFixed(1)),
                          )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.versesAverage === null
                        ? messages.kpiEmpty
                        : formatAnalyticsAverage(messages.formatAverage, Number(row.versesAverage.toFixed(1)))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.testAverage === null
                        ? messages.kpiEmpty
                        : formatAnalyticsAverage(messages.formatAverage, Number(row.testAverage.toFixed(1)))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.notebookAverage === null
                        ? messages.kpiEmpty
                        : formatAnalyticsAverage(messages.formatAverage, Number(row.notebookAverage.toFixed(1)))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
};
