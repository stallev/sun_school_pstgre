/** ADR-004 §4.8 — full IANA list via `Intl.supportedValuesOf("timeZone")`. */
let supportedTimeZones: ReadonlySet<string> | undefined;

const getSupportedTimeZones = (): ReadonlySet<string> => {
  if (!supportedTimeZones) {
    supportedTimeZones = new Set(Intl.supportedValuesOf("timeZone"));
  }
  return supportedTimeZones;
};

export const isValidIanaTimeZone = (timeZone: string): boolean => {
  if (timeZone.trim() === "") return false;
  return getSupportedTimeZones().has(timeZone);
};

/** Test helper — reset memoized zone list between cases. */
export const resetSupportedTimeZonesCache = (): void => {
  supportedTimeZones = undefined;
};
