import type { MessageLocale } from "@/lib/messages/dictionary-types";
import { formatNumber } from "@/lib/i18n/format";
import { fillMessage } from "@/lib/messages/fill-message";

export type AnalyticsChartScale = {
  domain: [number, number];
  ticks: number[];
};

export const PERCENT_CHART_SCALE: AnalyticsChartScale = {
  domain: [0, 100],
  ticks: [0, 50, 100],
};

export const SCORE_0_10_CHART_SCALE: AnalyticsChartScale = {
  domain: [0, 10],
  ticks: [0, 5, 10],
};

const VERSES_AXIS_STEP = 0.5;

const buildStepTicks = (min: number, max: number, step: number): number[] => {
  const ticks: number[] = [];
  for (let value = min; value <= max + step / 1000; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks;
};

/** Verses per lesson — axis from zero, step 0.5 (R-25 / D-10). */
export const computeVersesChartScale = (values: readonly number[]): AnalyticsChartScale => {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  const peak = finiteValues.length === 0 ? VERSES_AXIS_STEP : Math.max(...finiteValues);
  const maxTick = Math.max(VERSES_AXIS_STEP, Math.ceil(peak / VERSES_AXIS_STEP) * VERSES_AXIS_STEP);
  return {
    domain: [0, maxTick],
    ticks: buildStepTicks(0, maxTick, VERSES_AXIS_STEP),
  };
};

export const formatAnalyticsAxisNumber = (
  value: number,
  locale: MessageLocale,
): string => {
  const isWhole = Math.abs(value - Math.round(value)) < 1e-9;
  return formatNumber(value, locale, {
    minimumFractionDigits: isWhole ? 0 : 1,
    maximumFractionDigits: isWhole ? 0 : 1,
  });
};

export const formatPercentAxisTick = (
  percentTemplate: string,
  value: number,
  _locale: MessageLocale,
): string => fillMessage(percentTemplate, { value: Math.round(value) });
