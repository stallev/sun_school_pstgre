import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

export const pickGroupPointsMessages = (
  teacher: Dictionary,
  admin: Dictionary,
  common: Dictionary,
): GroupPointsMessages => ({
  pageTitle: getMessage(admin, "achievements.group_points_page_title"),
  pageSubtitleTemplate: getMessage(admin, "achievements.group_points_page_subtitle"),
  columnAchievement: getMessage(admin, "achievements.group_points_col_achievement"),
  columnTier: getMessage(admin, "achievements.group_points_col_tier"),
  columnCondition: getMessage(admin, "achievements.group_points_col_condition"),
  columnGlobal: getMessage(admin, "achievements.group_points_col_global"),
  columnGroup: getMessage(admin, "achievements.group_points_col_group"),
  placeholderInherit: getMessage(admin, "achievements.group_points_placeholder_inherit"),
  differsLabel: getMessage(admin, "achievements.group_points_differs"),
  resetRow: getMessage(admin, "achievements.group_points_reset"),
  save: getMessage(admin, "achievements.group_points_save"),
  saving: getMessage(teacher, "achievements.saving"),
  toastSaved: getMessage(admin, "achievements.group_points_toast_saved"),
  copyFromGroup: getMessage(admin, "achievements.group_points_copy"),
  copyDialogTitle: getMessage(admin, "achievements.group_points_copy_title"),
  copyDialogDescription: getMessage(admin, "achievements.group_points_copy_description"),
  copyConfirm: getMessage(admin, "achievements.group_points_copy_confirm"),
  cancel: getMessage(teacher, "achievements.cancel"),
  yearClosedTitle: getMessage(teacher, "group.year_closed_title"),
  yearClosedDescription: getMessage(teacher, "group.year_closed_description"),
  emptyCatalogTitle: getMessage(admin, "achievements.group_points_empty_title"),
  emptyCatalogDescription: getMessage(admin, "achievements.group_points_empty_description"),
  practiceReadOnly: getMessage(admin, "achievements.status_practice_pending"),
  yearLabel: getMessage(common, "shell.page_titles.year"),
  tableCaption: getMessage(admin, "achievements.group_points_table_caption"),
  tierLabels: [
    getMessage(admin, "achievements.tier_bronze"),
    getMessage(admin, "achievements.tier_silver"),
    getMessage(admin, "achievements.tier_gold"),
  ],
  tierLengthPoints: getMessage(admin, "achievements.tier_length_points"),
  penaltyMaxLabel: getMessage(admin, "achievements.group_points_penalty_max"),
  cardLink: getMessage(admin, "achievements.group_points_card_link"),
  formError: getMessage(common, "errors.form"),
});
