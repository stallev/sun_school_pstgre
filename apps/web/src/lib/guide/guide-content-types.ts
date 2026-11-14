export type GuideFeatureGate = "achievements" | "parents";

export type GuideStep = {
  text: string;
  link?: { href: string; label: string };
  textAfter?: string;
};

export type GuideSection = {
  id: string;
  title: string;
  requiresFeature?: GuideFeatureGate;
  steps: GuideStep[];
};

export type GuideTocGroup = {
  title: string;
  ids: string[];
};

export type GuideRoleContent = {
  tocGroups?: GuideTocGroup[];
  sections: GuideSection[];
};

export type GuideContentRole = "teacher" | "admin" | "parent";

export type GuideDictionary = {
  tocHeading: string;
  tocJump: string;
  roles: Record<GuideContentRole, GuideRoleContent>;
};
