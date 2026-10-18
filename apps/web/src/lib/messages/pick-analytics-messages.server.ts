import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { AnalyticsMessages } from "@/lib/messages/analytics-messages";

const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );

export const pickAnalyticsMessages = (analytics: Dictionary): AnalyticsMessages => ({
  pageTitle: getMessage(analytics, "page.title"),
  pageSubtitle: (group, year) => fill(getMessage(analytics, "page.subtitle"), { group, year }),
  gradeFilterLabel: getMessage(analytics, "filters.grade_label"),
  gradeFilterApply: getMessage(analytics, "filters.grade_apply"),
  periodYear: getMessage(analytics, "filters.period_year"),
  periodMonth: getMessage(analytics, "filters.period_month"),
  periodRange: getMessage(analytics, "filters.period_range"),
  monthLabel: getMessage(analytics, "filters.month_label"),
  rangeFrom: getMessage(analytics, "filters.range_from"),
  rangeTo: getMessage(analytics, "filters.range_to"),
  periodApply: getMessage(analytics, "filters.period_apply"),
  kpiAttendanceLabel: getMessage(analytics, "kpi.attendance_label"),
  kpiAttendanceHint: (count) => fill(getMessage(analytics, "kpi.attendance_hint"), { count }),
  kpiVersesLabel: getMessage(analytics, "kpi.verses_label"),
  kpiTestLabel: getMessage(analytics, "kpi.test_label"),
  kpiNotebookLabel: getMessage(analytics, "kpi.notebook_label"),
  kpiWithN: (value, n) => fill(getMessage(analytics, "kpi.with_n"), { value, n }),
  kpiEmpty: getMessage(analytics, "kpi.empty"),
  sampleComposition: (a, b, c, d) =>
    fill(getMessage(analytics, "sample.composition"), { a, b, c, d }),
  charts: {
    attendanceTitle: getMessage(analytics, "charts.attendance_title"),
    versesTitle: getMessage(analytics, "charts.verses_title"),
    testTitle: getMessage(analytics, "charts.test_title"),
    notebookTitle: getMessage(analytics, "charts.notebook_title"),
    columnDate: getMessage(analytics, "charts.column_date"),
    columnValue: getMessage(analytics, "charts.column_value"),
    columnObservations: getMessage(analytics, "charts.column_observations"),
    showChart: getMessage(analytics, "charts.show_chart"),
    showTable: getMessage(analytics, "charts.show_table"),
    insufficientDataTitle: getMessage(analytics, "chart.insufficient_data_title"),
    insufficientDataDescription: getMessage(analytics, "chart.insufficient_data"),
    methodologyAttendance: getMessage(analytics, "methodology.attendance"),
    methodologyVerses: getMessage(analytics, "methodology.verses"),
    methodologyTest: getMessage(analytics, "methodology.test"),
    methodologyNotebook: getMessage(analytics, "methodology.notebook"),
  },
  tables: {
    layerATitle: getMessage(analytics, "tables.layer_a_title"),
    layerBTitle: getMessage(analytics, "tables.layer_b_title"),
    layerCTitle: getMessage(analytics, "tables.layer_c_title"),
    layerDTitle: getMessage(analytics, "tables.layer_d_title"),
    layerBirthYearTitle: getMessage(analytics, "tables.birth_year_title"),
    layerBirthYearNote: getMessage(analytics, "tables.birth_year_note"),
    emptySection: getMessage(analytics, "tables.empty_section"),
    columnName: getMessage(analytics, "tables.column_name"),
    columnBirthYear: getMessage(analytics, "tables.column_birth_year"),
    columnAttendance: getMessage(analytics, "tables.column_attendance"),
    columnAttended: getMessage(analytics, "tables.column_attended"),
    columnChecked: getMessage(analytics, "tables.column_checked"),
    columnVerses: getMessage(analytics, "tables.column_verses"),
    columnTest: getMessage(analytics, "tables.column_test"),
    columnNotebook: getMessage(analytics, "tables.column_notebook"),
    columnEnrolledSince: getMessage(analytics, "tables.column_enrolled_since"),
    emptyPupilsTitle: getMessage(analytics, "empty.no_pupils_title"),
    emptyPupilsDescription: getMessage(analytics, "empty.no_pupils_description"),
    noCheckedLessonsTitle: getMessage(analytics, "empty.no_checked_lessons_title"),
    noCheckedLessonsDescription: getMessage(analytics, "empty.no_checked_lessons"),
  },
  conducted: {
    title: getMessage(analytics, "conducted.title"),
    subtitle: getMessage(analytics, "conducted.subtitle"),
    columnTeacher: getMessage(analytics, "conducted.column_teacher"),
    columnConducted: getMessage(analytics, "conducted.column_conducted"),
    columnRegular: getMessage(analytics, "conducted.column_regular"),
    columnReview: getMessage(analytics, "conducted.column_review"),
    columnPlanned: getMessage(analytics, "conducted.column_planned"),
    columnLessons: getMessage(analytics, "conducted.column_lessons"),
    noLongerAssigned: getMessage(analytics, "conducted.no_longer_assigned"),
    empty: getMessage(analytics, "conducted.empty"),
  },
  methodology: {
    title: getMessage(analytics, "methodology.title"),
    body: getMessage(analytics, "methodology.body"),
  },
  dataQuality: {
    title: getMessage(analytics, "data_quality.title"),
    missingRecords: (count) => fill(getMessage(analytics, "data_quality.missing_records"), { count }),
  },
  deletionRecalculated: getMessage(analytics, "deletion_recalculated"),
  formatPercent: (value) => fill(getMessage(analytics, "format.percent"), { value }),
  formatAverage: (value) => fill(getMessage(analytics, "format.average"), { value }),
  formatChartValue: (point) =>
    point.value === null
      ? getMessage(analytics, "kpi.empty")
      : fill(getMessage(analytics, "format.chart_value"), {
          value: point.value,
          n: point.observationCount,
        }),
});
