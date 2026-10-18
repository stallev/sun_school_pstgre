import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import { TREND_LABEL } from "@sunschool/domain";
import type { AnalyticsMessages, PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";

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
  rating: {
    pageTitle: getMessage(analytics, "rating.page_title"),
    pageSubtitleGroup: (group, year) =>
      fill(getMessage(analytics, "rating.page_subtitle_group"), { group, year }),
    pageSubtitleSchool: (year) =>
      fill(getMessage(analytics, "rating.page_subtitle_school"), { year }),
    privacyNote: getMessage(analytics, "rating.privacy_note"),
    footnote: getMessage(analytics, "rating.footnote"),
    columnPlace: getMessage(analytics, "rating.column_place"),
    columnPupil: getMessage(analytics, "rating.column_pupil"),
    columnMetric: getMessage(analytics, "rating.column_metric"),
    empty: getMessage(analytics, "rating.empty"),
    scopeGroup: getMessage(analytics, "rating.scope_group"),
    scopeSchool: getMessage(analytics, "rating.scope_school"),
  },
  school: {
    pageTitle: getMessage(analytics, "school.page_title"),
    pageSubtitle: (year) => fill(getMessage(analytics, "school.page_subtitle"), { year }),
    groupsTableTitle: getMessage(analytics, "school.groups_table_title"),
    groupsTableHint: getMessage(analytics, "school.groups_table_hint"),
    columnGroup: getMessage(analytics, "school.column_group"),
    columnTeachers: getMessage(analytics, "school.column_teachers"),
    columnPupils: getMessage(analytics, "school.column_pupils"),
    columnAttendance: getMessage(analytics, "school.column_attendance"),
    columnAverage: getMessage(analytics, "school.column_average"),
    columnLastLesson: getMessage(analytics, "school.column_last_lesson"),
    lastLessonOk: (label) => fill(getMessage(analytics, "school.last_lesson_ok"), { label }),
    lastLessonWarn: (label) => fill(getMessage(analytics, "school.last_lesson_warn"), { label }),
    lastLessonIdle: getMessage(analytics, "school.last_lesson_idle"),
    attendanceChartTitle: getMessage(analytics, "school.attendance_chart_title"),
    attendanceChartHint: getMessage(analytics, "school.attendance_chart_hint"),
    attentionTitle: getMessage(analytics, "school.attention_title"),
    attentionPending: (count) =>
      fill(getMessage(analytics, "school.attention_pending"), { count }),
    attentionNegativeBricks: (count) =>
      fill(getMessage(analytics, "school.attention_negative_bricks"), { count }),
    attentionPendingHint: getMessage(analytics, "school.attention_pending_hint"),
    attentionNegativeBricksHint: getMessage(analytics, "school.attention_negative_bricks_hint"),
    conductedGradeLabel: getMessage(analytics, "school.conducted_grade_label"),
  },
});

export const pickPupilAnalyticsMessages = (analytics: Dictionary): PupilAnalyticsMessages => ({
  ...pickAnalyticsMessages(analytics),
  pupilPageSubtitle: (year) => fill(getMessage(analytics, "pupil.page_subtitle"), { year }),
  backToGroupAnalytics: getMessage(analytics, "pupil.back_to_group"),
  sampleIncluded: getMessage(analytics, "sample.included"),
  sampleExcludedB: getMessage(analytics, "sample.excluded_b"),
  sampleExcludedC: getMessage(analytics, "sample.excluded_c"),
  sampleExcludedD: getMessage(analytics, "sample.excluded_d"),
  sampleInGroupAverages: (included) =>
    fill(getMessage(analytics, "sample.in_group_averages"), {
      included: included
        ? getMessage(analytics, "sample.included_yes")
        : getMessage(analytics, "sample.included_no"),
    }),
  personalMetricSuffix: getMessage(analytics, "pupil.personal_suffix"),
  attendanceChecked: (attended, checked) =>
    fill(getMessage(analytics, "pupil.attendance_checked"), { attended, checked }),
  presenceTitle: getMessage(analytics, "pupil.presence_title"),
  presencePresent: getMessage(analytics, "pupil.presence_present"),
  presenceAbsent: getMessage(analytics, "pupil.presence_absent"),
  presenceMissing: getMessage(analytics, "pupil.presence_missing"),
  lessonsTitle: getMessage(analytics, "pupil.lessons_title"),
  lessonsEmpty: getMessage(analytics, "pupil.lessons_empty"),
  lessonColumnDate: getMessage(analytics, "pupil.lesson_column_date"),
  lessonColumnTopic: getMessage(analytics, "pupil.lesson_column_topic"),
  lessonColumnPresent: getMessage(analytics, "pupil.lesson_column_present"),
  lessonColumnVerses: getMessage(analytics, "pupil.lesson_column_verses"),
  lessonColumnTest: getMessage(analytics, "pupil.lesson_column_test"),
  lessonColumnNotebook: getMessage(analytics, "pupil.lesson_column_notebook"),
  presentYes: getMessage(analytics, "pupil.present_yes"),
  presentNo: getMessage(analytics, "pupil.present_no"),
  presentMissing: getMessage(analytics, "pupil.present_missing"),
  versesOf: (recited, total) =>
    fill(getMessage(analytics, "pupil.verses_of"), { recited, total }),
  testNotConducted: getMessage(analytics, "pupil.test_not_conducted"),
  submittedLate: (dateLabel) => fill(getMessage(analytics, "pupil.submitted_late"), { date: dateLabel }),
  dynamicsTitle: getMessage(analytics, "pupil.dynamics_title"),
  dynamicsHint: getMessage(analytics, "pupil.dynamics_hint"),
  dynamicsNormalizedTitle: getMessage(analytics, "pupil.dynamics_normalized_title"),
  dynamicsDeltaTitle: getMessage(analytics, "pupil.dynamics_delta_title"),
  dynamicsNormalizedAria: getMessage(analytics, "pupil.dynamics_normalized_aria"),
  dynamicsDeltaAria: getMessage(analytics, "pupil.dynamics_delta_aria"),
  dynamicsInsufficientPoints: getMessage(analytics, "pupil.dynamics_insufficient_points"),
  dynamicsSlope: (delta) => fill(getMessage(analytics, "pupil.dynamics_slope"), { delta }),
  dynamicsTrendLabels: {
    [TREND_LABEL.GROWING]: {
      label: getMessage(analytics, "pupil.dynamics_trend_growing"),
      toneClass: "text-ok",
    },
    [TREND_LABEL.DECLINING]: {
      label: getMessage(analytics, "pupil.dynamics_trend_declining"),
      toneClass: "text-danger",
    },
    [TREND_LABEL.STABLE]: {
      label: getMessage(analytics, "pupil.dynamics_trend_stable"),
      toneClass: "text-ink",
    },
    [TREND_LABEL.INSUFFICIENT_DATA]: {
      label: getMessage(analytics, "pupil.dynamics_trend_insufficient"),
      toneClass: "text-muted-foreground",
    },
  },
});
