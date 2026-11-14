import type { GuideSection, GuideTocGroup } from "@/lib/guide/guide-content-types";

export type GuideTocSectionGroup = {
  title?: string;
  sections: GuideSection[];
};

/** Groups visible sections for the TOC; empty groups are dropped, ungrouped sections trail. */
export const buildGuideTocGroups = (
  sections: GuideSection[],
  tocGroups: GuideTocGroup[] | undefined,
): GuideTocSectionGroup[] => {
  if (!tocGroups?.length) return sections.length ? [{ sections }] : [];

  const byId = new Map(sections.map((section) => [section.id, section]));
  const placedIds = new Set<string>();
  const groups: GuideTocSectionGroup[] = [];

  for (const group of tocGroups) {
    const groupSections = group.ids.flatMap((id) => {
      const section = byId.get(id);
      return section ? [section] : [];
    });
    groupSections.forEach((section) => placedIds.add(section.id));
    if (groupSections.length) groups.push({ title: group.title, sections: groupSections });
  }

  const rest = sections.filter((section) => !placedIds.has(section.id));
  if (rest.length) groups.push({ sections: rest });
  return groups;
};
