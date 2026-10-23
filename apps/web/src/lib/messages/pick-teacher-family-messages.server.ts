import "server-only";

import { ADULT_RELATION } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { TeacherFamilyMessages } from "@/lib/messages/teacher-family-messages";

export const pickTeacherFamilyMessages = (teacher: Dictionary): TeacherFamilyMessages => ({
  sectionTitlePrefix: getMessage(teacher, "family.section_title_prefix"),
  sectionTitle: getMessage(teacher, "family.section_title"),
  noFamily: getMessage(teacher, "family.no_family"),
  adminFamilyLinkLabel: getMessage(teacher, "family.admin_family_link"),
  relationLabels: {
    [ADULT_RELATION.MOTHER]: getMessage(teacher, "family.relation_mother"),
    [ADULT_RELATION.FATHER]: getMessage(teacher, "family.relation_father"),
    [ADULT_RELATION.GUARDIAN]: getMessage(teacher, "family.relation_guardian"),
  },
});
