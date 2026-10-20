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
import {
  formatAnalyticsAverage,
  formatAnalyticsPercent,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

type GroupAnalyticsTablesProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
};

const formatScore = (average: number | null, n: number, messages: AnalyticsMessages): string => {
  if (average === null || n === 0) return messages.kpiEmpty;
  return fillMessage(messages.kpiWithN, {
    value: formatAnalyticsAverage(messages.formatAverage, Number(average.toFixed(1))),
    n,
  });
};

const PupilLayerTable = ({
  title,
  rows,
  messages,
  variant,
}: {
  title: string;
  rows: GroupAnalyticsPupilRow[];
  messages: AnalyticsMessages;
  variant: "abcd" | "d-only";
}) => (
  <section className="space-y-2">
    <SectionTitle as="h2" className="text-lg">{title}</SectionTitle>
    {rows.length === 0 ? (
      <ContentText className="text-sm text-muted-foreground">{messages.tables.emptySection}</ContentText>
    ) : (
      <Card className="overflow-x-auto p-0">
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{messages.tables.columnName}</TableHead>
              <TableHead scope="col">{messages.tables.columnBirthYear}</TableHead>
              {variant === "abcd" ? (
                <>
                  <TableHead scope="col">{messages.tables.columnAttendance}</TableHead>
                  <TableHead scope="col">{messages.tables.columnAttended}</TableHead>
                  <TableHead scope="col">{messages.tables.columnChecked}</TableHead>
                  <TableHead scope="col">{messages.tables.columnVerses}</TableHead>
                  <TableHead scope="col">{messages.tables.columnTest}</TableHead>
                  <TableHead scope="col">{messages.tables.columnNotebook}</TableHead>
                </>
              ) : (
                <TableHead scope="col">{messages.tables.columnEnrolledSince}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.pupilId}>
                <TableCell>
                  <CustomLink href={`/analytics/pupils/${row.pupilId}`}>{row.displayName}</CustomLink>
                </TableCell>
                <TableCell>{row.birthYear ?? messages.kpiEmpty}</TableCell>
                {variant === "abcd" ? (
                  <>
                    <TableCell>
                      {row.attendanceRate === null
                        ? messages.kpiEmpty
                        : formatAnalyticsPercent(
                            messages.formatPercent,
                            Number(row.attendanceRate.toFixed(1)),
                          )}
                    </TableCell>
                    <TableCell>{row.attendedLessonCount}</TableCell>
                    <TableCell>{row.checkedLessonCount}</TableCell>
                    <TableCell>{formatScore(row.versesAverage.average, row.versesAverage.observationCount, messages)}</TableCell>
                    <TableCell>{formatScore(row.testAverage.average, row.testAverage.observationCount, messages)}</TableCell>
                    <TableCell>{formatScore(row.notebookAverage.average, row.notebookAverage.observationCount, messages)}</TableCell>
                  </>
                ) : (
                  <TableCell>{messages.kpiEmpty}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )}
  </section>
);

export const GroupAnalyticsTables = ({ snapshot, messages }: GroupAnalyticsTablesProps) => {
  const layerA = snapshot.pupilsByLayer[SAMPLE_LAYER.A];
  const layerB = snapshot.pupilsByLayer[SAMPLE_LAYER.B];
  const layerC = snapshot.pupilsByLayer[SAMPLE_LAYER.C];
  const layerD = snapshot.pupilsByLayer[SAMPLE_LAYER.D];

  return (
    <div className="space-y-6">
      <PupilLayerTable title={messages.tables.layerATitle} rows={layerA} messages={messages} variant="abcd" />
      <PupilLayerTable title={messages.tables.layerBTitle} rows={layerB} messages={messages} variant="abcd" />
      <PupilLayerTable title={messages.tables.layerCTitle} rows={layerC} messages={messages} variant="abcd" />
      <PupilLayerTable title={messages.tables.layerDTitle} rows={layerD} messages={messages} variant="d-only" />
      <section className="space-y-2">
        <SectionTitle as="h2" className="text-lg">{messages.tables.layerBirthYearTitle}</SectionTitle>
        <ContentText className="text-sm text-muted-foreground">{messages.tables.layerBirthYearNote}</ContentText>
      </section>
    </div>
  );
};
