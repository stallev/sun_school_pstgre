import type { AnalyticsChartPoint } from "@/data/analytics/analytics-compute.server";

export type AnalyticsChartSeriesMessages = {
  attendanceTitle: string;
  versesTitle: string;
  testTitle: string;
  notebookTitle: string;
  columnDate: string;
  columnValue: string;
  columnObservations: string;
  showChart: string;
  showTable: string;
  insufficientDataTitle: string;
  insufficientDataDescription: string;
  methodologyAttendance: string;
  methodologyVerses: string;
  methodologyTest: string;
  methodologyNotebook: string;
};

export type AnalyticsMessages = {
  pageTitle: string;
  pageSubtitle: (group: string, year: string) => string;
  gradeFilterLabel: string;
  gradeFilterApply: string;
  periodYear: string;
  periodMonth: string;
  periodRange: string;
  monthLabel: string;
  rangeFrom: string;
  rangeTo: string;
  periodApply: string;
  kpiAttendanceLabel: string;
  kpiAttendanceHint: (count: number) => string;
  kpiVersesLabel: string;
  kpiTestLabel: string;
  kpiNotebookLabel: string;
  kpiWithN: (value: string, n: number) => string;
  kpiEmpty: string;
  sampleComposition: (a: number, b: number, c: number, d: number) => string;
  charts: AnalyticsChartSeriesMessages;
  tables: {
    layerATitle: string;
    layerBTitle: string;
    layerCTitle: string;
    layerDTitle: string;
    layerBirthYearTitle: string;
    layerBirthYearNote: string;
    emptySection: string;
    columnName: string;
    columnBirthYear: string;
    columnAttendance: string;
    columnAttended: string;
    columnChecked: string;
    columnVerses: string;
    columnTest: string;
    columnNotebook: string;
    columnEnrolledSince: string;
    emptyPupilsTitle: string;
    emptyPupilsDescription: string;
    noCheckedLessonsTitle: string;
    noCheckedLessonsDescription: string;
  };
  conducted: {
    title: string;
    subtitle: string;
    columnTeacher: string;
    columnConducted: string;
    columnRegular: string;
    columnReview: string;
    columnPlanned: string;
    columnLessons: string;
    noLongerAssigned: string;
    empty: string;
  };
  methodology: {
    title: string;
    body: string;
  };
  dataQuality: {
    title: string;
    missingRecords: (count: number) => string;
  };
  deletionRecalculated: string;
  formatPercent: (value: number) => string;
  formatAverage: (value: number) => string;
  formatChartValue: (point: AnalyticsChartPoint) => string;
};
