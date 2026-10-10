export function getGaMeasurementId(): string | undefined {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return measurementId || undefined;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return Boolean(getGaMeasurementId());
}
