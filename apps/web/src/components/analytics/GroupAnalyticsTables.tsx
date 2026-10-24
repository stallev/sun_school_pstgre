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
  formatAnalyticsPercent,
  formatAnalyticsShortDate,
} from "@/lib/analytics/format-analytics-display";
import { fillMessage } from "@/lib/messages/fill-message";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";
import { BirthYearCohortCards } from "./BirthYearCohortCards";
import { formatCohortAverage, formatCohortPercent, formatGroupScore } from "./format-group-score";
import { PupilLayerCards } from "./PupilLayerCards";

type GroupAnalyticsTablesProps = {
  snapshot: GroupAnalyticsSnapshot;
  messages: AnalyticsMessages;
  locale: string;
};

type TableVariant = "layer-a" | "layer-b" | "layer-c" | "layer-d";

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
}) => {
  const titleClassName =
    variant === "layer-b"
      ? "mt-8 mb-1 text-[1.25rem] font-medium leading-snug"
      : variant === "layer-c" || variant === "layer-d"
        ? "mb-3 text-[1.25rem] font-medium leading-snug"
        : "mt-8 mb-3 text-[1.25rem] font-medium leading-snug";

  return (
  <section className="min-w-0">
    <SectionTitle as="h2" className={titleClassName}>
      {title}
    </SectionTitle>
    {intro ? <ContentText className="mb-3 text-sm text-ink-2">{intro}</ContentText> : null}
    {rows.length === 0 ? (
      <ContentText className="text-sm text-muted">{messages.tables.emptySection}</ContentText>
    ) : (
      <>
      <PupilLayerCards rows={rows} messages={messages} variant={variant} locale={locale} />
      <Card className="hidden p-0 lg:block">
        <Table className="text-base">
          <TableHeader className="border-b border-line text-sm text-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="px-5 py-3 font-normal">
                {messages.tables.columnName}
              </TableHead>
              {variant !== "layer-d" ? (
                <TableHead scope="col" className="px-3 py-3 font-normal">
                  {messages.tables.columnBirthYear}
                </TableHead>
              ) : null}
              {variant === "layer-a" ? (
                <>
                  <TableHead scope="col" className="px-3 py-3 font-normal">
                    {messages.tables.columnAttendance}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 font-normal">
                    {messages.tables.columnAttendedChecked}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 font-normal">
                    {messages.tables.columnVerses}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 font-normal">
                    {messages.tables.columnTest}
                  </TableHead>
                  <TableHead scope="col" className="px-5 py-3 font-normal">
                    {messages.tables.columnNotebook}
                  </TableHead>
                </>
              ) : null}
              {variant === "layer-b" ? (
                <>
                  <TableHead scope="col" className="px-3 py-3 font-normal">
                    {messages.tables.columnAttended}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 font-normal">
                    {messages.tables.columnCheckedLessons}
                  </TableHead>
                  <TableHead scope="col" className="px-5 py-3 font-normal">
                    {messages.tables.columnAttendance}
                  </TableHead>
                </>
              ) : null}
              {variant === "layer-d" ? (
                <TableHead scope="col" className="px-5 py-3 font-normal">
                  {messages.tables.columnEnrolledSince}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-line">
            {rows.map((row) => (
              <TableRow key={row.pupilId} className="hover:bg-transparent">
                <TableCell className="px-5 py-3">
                  <CustomLink
                    href={`/analytics/pupils/${row.pupilId}`}
                    className="text-ink font-medium hover:text-cobalt-ink focus-visible:text-cobalt-ink"
                  >
                    {row.displayName}
                  </CustomLink>
                </TableCell>
                {variant !== "layer-d" ? (
                  <TableCell className="px-3 py-3">{row.birthYear ?? messages.kpiEmpty}</TableCell>
                ) : null}
                {variant === "layer-a" ? (
                  <>
                    <TableCell className="px-3 py-3">
                      {row.attendanceRate === null
                        ? messages.kpiEmpty
                        : formatAnalyticsPercent(
                            messages.formatPercent,
                            Number(row.attendanceRate.toFixed(1)),
                          )}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {fillMessage(messages.tables.attendedCheckedValue, {
                        attended: row.attendedLessonCount,
                        checked: row.checkedLessonCount,
                      })}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {formatGroupScore(row.versesAverage.average, row.versesAverage.observationCount, messages)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {formatGroupScore(row.testAverage.average, row.testAverage.observationCount, messages)}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      {formatGroupScore(row.notebookAverage.average, row.notebookAverage.observationCount, messages)}
                    </TableCell>
                  </>
                ) : null}
                {variant === "layer-b" ? (
                  <>
                    <TableCell className="px-3 py-3">{row.attendedLessonCount}</TableCell>
                    <TableCell className="px-3 py-3">{row.checkedLessonCount}</TableCell>
                    <TableCell className="px-5 py-3">
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
                  <TableCell className="px-5 py-3">
                    {formatAnalyticsShortDate(row.enrolledSinceIso, locale)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      </>
    )}
  </section>
  );
};

export const GroupAnalyticsTables = ({ snapshot, messages, locale }: GroupAnalyticsTablesProps) => {
  const layerA = snapshot.pupilsByLayer[SAMPLE_LAYER.A];
  const layerB = snapshot.pupilsByLayer[SAMPLE_LAYER.B];
  const layerC = snapshot.pupilsByLayer[SAMPLE_LAYER.C];
  const layerD = snapshot.pupilsByLayer[SAMPLE_LAYER.D];
  const birthYearRows = buildBirthYearCohortRows(layerA);

  return (
    <div className="min-w-0">
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
      <div className="mt-8 grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
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
      <section className="min-w-0">
        <SectionTitle as="h2" className="mt-8 mb-3 text-[1.25rem] font-medium leading-snug">
          {messages.tables.layerBirthYearTitle}
        </SectionTitle>
        <ContentText className="mb-3 text-sm text-ink-2">{messages.tables.layerBirthYearNote}</ContentText>
        {birthYearRows.length === 0 ? (
          <ContentText className="text-sm text-muted">{messages.tables.emptySection}</ContentText>
        ) : (
          <>
          <BirthYearCohortCards rows={birthYearRows} messages={messages} />
          <Card className="hidden p-0 lg:block">
            <Table className="text-base">
              <TableHeader className="border-b border-line text-sm text-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="px-5 py-3 font-normal">
                    {messages.tables.columnBirthYear}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                    {messages.tables.columnBirthYearKids}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                    {messages.tables.columnAttendance}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                    {messages.tables.columnVerses}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right font-normal">
                    {messages.tables.columnTest}
                  </TableHead>
                  <TableHead scope="col" className="px-5 py-3 text-right font-normal">
                    {messages.tables.columnNotebook}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-line">
                {birthYearRows.map((row) => (
                  <TableRow key={row.birthYear ?? "unknown"} className="hover:bg-transparent">
                    <TableCell className="px-5 py-3 tabular-nums">{row.birthYear ?? messages.kpiEmpty}</TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums">{row.pupilCount}</TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums">
                      {formatCohortPercent(row.attendancePercent, messages)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums">
                      {formatCohortAverage(row.versesAverage, messages)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums">
                      {formatCohortAverage(row.testAverage, messages)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right tabular-nums">
                      {formatCohortAverage(row.notebookAverage, messages)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          </>
        )}
      </section>
    </div>
  );
};
