import type { GuideFeatureGate, GuideSection } from "@/lib/guide/guide-content-types";

export type GuideFeatureFlags = {
  achievementsEnabled: boolean;
  parentsEnabled: boolean;
};

const isFeatureEnabled = (gate: GuideFeatureGate, flags: GuideFeatureFlags): boolean => {
  if (gate === "achievements") return flags.achievementsEnabled;
  return flags.parentsEnabled;
};

export const filterGuideSections = (
  sections: GuideSection[],
  flags: GuideFeatureFlags,
): GuideSection[] =>
  sections.filter(
    (section) =>
      !section.requiresFeature || isFeatureEnabled(section.requiresFeature, flags),
  );
