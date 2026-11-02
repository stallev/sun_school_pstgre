/** Inset danger outline per table cell when a row has a CONFLICT (homework_check_flow_spec §7.2). */
const CONFLICT_OUTLINE_FIRST =
  "shadow-[inset_0_2px_0_0_var(--color-danger),inset_0_-2px_0_0_var(--color-danger),inset_2px_0_0_0_var(--color-danger)]";
const CONFLICT_OUTLINE_MIDDLE =
  "shadow-[inset_0_2px_0_0_var(--color-danger),inset_0_-2px_0_0_var(--color-danger)]";
const CONFLICT_OUTLINE_LAST =
  "shadow-[inset_0_2px_0_0_var(--color-danger),inset_0_-2px_0_0_var(--color-danger),inset_-2px_0_0_0_var(--color-danger)]";

export const lessonCheckTableConflictCellOutline = (
  position: "first" | "middle" | "last",
): string => {
  if (position === "first") return CONFLICT_OUTLINE_FIRST;
  if (position === "last") return CONFLICT_OUTLINE_LAST;
  return CONFLICT_OUTLINE_MIDDLE;
};
