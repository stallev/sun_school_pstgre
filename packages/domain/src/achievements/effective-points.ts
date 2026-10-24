/**
 * achievement_group_points_contract §6.2 — effective points for a group-year override.
 */
export function resolveEffectivePoints(globalPoints: number, override: number | undefined): number {
  return override === undefined ? globalPoints : override;
}
