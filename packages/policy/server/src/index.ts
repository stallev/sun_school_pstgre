export {
  canAwardManually,
  canRevokeAward,
  canSetGroupAchievementMode,
  type CanAwardManuallyFacts,
  type CanSetGroupAchievementModeFacts,
} from "./achievements-mutate";
export {
  canViewGroupYear,
  canViewPupilYears,
} from "./analytics-year";
export type { CanViewGroupYearFacts, CanViewPupilYearsFacts } from "./analytics-year";
export { ALLOWED, isActive } from "./context";
export type { PolicyDecision, PolicySessionContext } from "./context";
export { checkRole } from "./require-role";
