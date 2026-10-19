import { ACADEMIC_YEAR_STATUS, CONSENT_CHANNEL, CONSENT_STATUS } from "@sunschool/domain";

/** Synthetic migrated pupil — P07 §Совместимость п. 3–6 (no real PII). */
export const SYNTHETIC_LEGACY_IMPORT = {
  pupil: {
    lastName: "Synth",
    firstName: "Legacy",
    isActive: true,
  },
  consent: {
    status: CONSENT_STATUS.LEGACY_PENDING,
    channel: CONSENT_CHANNEL.PAPER,
    signedOn: null,
    textVersion: "legacy",
  },
  appSetting: {
    legacyConsentDeadlineOn: "2026-12-31",
  },
  enrollment: {
    endsOn: null as string | null,
  },
  academicYear: {
    status: ACADEMIC_YEAR_STATUS.ACTIVE,
  },
  todayInsideDeadline: "2026-06-01",
  todayAfterDeadline: "2027-01-15",
} as const;
