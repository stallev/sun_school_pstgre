export const COMPLAINT_RESOLUTIONS = [
  "no_action",
  "warning_to_trainer",
  "refund_recommended",
  "duplicate",
  "spam",
] as const;

export type ComplaintResolution = (typeof COMPLAINT_RESOLUTIONS)[number];

export const COMPLAINT_RESOLUTION = {
  NO_ACTION: "no_action",
  WARNING_TO_TRAINER: "warning_to_trainer",
  REFUND_RECOMMENDED: "refund_recommended",
  DUPLICATE: "duplicate",
  SPAM: "spam",
} as const satisfies Record<string, ComplaintResolution>;

export const COMPLAINT_RESOLUTION_NOTES_MIN_LENGTH = 10;

export const COMPLAINT_RESOLUTIONS_REQUIRING_NOTES: readonly ComplaintResolution[] =
  [
    COMPLAINT_RESOLUTION.NO_ACTION,
    COMPLAINT_RESOLUTION.WARNING_TO_TRAINER,
    COMPLAINT_RESOLUTION.REFUND_RECOMMENDED,
  ];

export function complaintResolutionRequiresNotes(
  resolution: ComplaintResolution,
): boolean {
  return COMPLAINT_RESOLUTIONS_REQUIRING_NOTES.includes(resolution);
}
