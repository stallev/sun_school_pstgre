export {
  canAwardManually,
  canRevokeAward,
  canSetGroupAchievementMode,
  type CanAwardManuallyFacts,
  type CanSetGroupAchievementModeFacts,
} from "./achievements-mutate";
export {
  canCreateFamily,
  canMutateFamily,
  type CanMutateFamilyFacts,
} from "./family-mutate";
export {
  canListFamilyContacts,
  type CanListFamilyContactsFacts,
} from "./family-contacts";
export {
  canMutateOwnChildConsent,
  type CanMutateOwnChildConsentFacts,
} from "./parent-consent";
export {
  canViewGroupYear,
  canViewPupilYears,
} from "./analytics-year";
export type { CanViewGroupYearFacts, CanViewPupilYearsFacts } from "./analytics-year";
export { ALLOWED, isActive } from "./context";
export type { PolicyDecision, PolicySessionContext } from "./context";
export { checkRole } from "./require-role";
