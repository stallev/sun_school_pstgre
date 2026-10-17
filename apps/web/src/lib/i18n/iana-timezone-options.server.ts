import "server-only";

/** Full IANA list for admin timezone picker (ADR-004 §4.8). */
export const listIanaTimeZoneOptions = (): string[] =>
  [...Intl.supportedValuesOf("timeZone")].sort((left, right) => left.localeCompare(right));
