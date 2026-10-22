import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";

export type AchievementsCatalogMessages = {
  pageTitle: string;
  pageSubtitle: string;
  recalcHint: string;
  recalcButton: string;
  rulesNote: string;
  sectionByCategory: Record<string, string>;
  sectionPenalties: string;
  penaltiesIntro: string;
  statusEnabled: string;
  statusDisabled: string;
  statusPracticePending: string;
  toggleEnable: string;
  addReward: string;
  addPenalty: string;
  activePenalties: string;
  tierLabels: [string, string, string];
  tierLengthPoints: string;
  toastSaved: string;
  toastRecalculated: string;
  toastToggled: string;
  submitPending: string;
  formError: string;
  closeLabel: string;
  cancelLabel: string;
  rewardDialogCreate: string;
  rewardDialogEdit: string;
  rewardDialogHint: string;
  penaltyDialogCreate: string;
  penaltyDialogEdit: string;
  penaltyDialogHint: string;
  fieldName: string;
  fieldNameEn: string;
  fieldCategory: string;
  fieldTiers: string;
  fieldTiersHint: string;
  fieldTierPointsPlaceholder: string;
  fieldMaxPoints: string;
  fieldMaxPointsHint: string;
  createSubmit: string;
  saveSubmit: string;
};

export const pickAchievementsCatalogMessages = (
  admin: Dictionary,
  common: Dictionary,
): AchievementsCatalogMessages => ({
  pageTitle: getMessage(admin, "page.achievements_title"),
  pageSubtitle: getMessage(admin, "achievements.page_subtitle"),
  recalcHint: getMessage(admin, "achievements.recalc_hint"),
  recalcButton: getMessage(admin, "achievements.recalc_button"),
  rulesNote: getMessage(admin, "achievements.rules_note"),
  sectionByCategory: {
    CONSISTENCY: getMessage(admin, "achievements.section_consistency"),
    EFFORT: getMessage(admin, "achievements.section_effort"),
    MEMORY: getMessage(admin, "achievements.section_memory"),
  },
  sectionPenalties: getMessage(admin, "achievements.section_penalties"),
  penaltiesIntro: getMessage(admin, "achievements.penalties_intro"),
  statusEnabled: getMessage(admin, "achievements.status_enabled"),
  statusDisabled: getMessage(admin, "achievements.status_disabled"),
  statusPracticePending: getMessage(admin, "achievements.status_practice_pending"),
  toggleEnable: getMessage(admin, "achievements.toggle_enable"),
  addReward: getMessage(admin, "achievements.add_reward"),
  addPenalty: getMessage(admin, "achievements.add_penalty"),
  activePenalties: getMessage(admin, "achievements.active_penalties"),
  tierLabels: [
    getMessage(admin, "achievements.tier_bronze"),
    getMessage(admin, "achievements.tier_silver"),
    getMessage(admin, "achievements.tier_gold"),
  ],
  tierLengthPoints: getMessage(admin, "achievements.tier_length_points"),
  toastSaved: getMessage(admin, "achievements.toast_saved"),
  toastRecalculated: getMessage(admin, "achievements.toast_recalculated"),
  toastToggled: getMessage(admin, "achievements.toast_toggled"),
  submitPending: getMessage(admin, "achievements.submit_pending"),
  formError: getMessage(common, "errors.form"),
  closeLabel: getMessage(common, "shell.close"),
  cancelLabel: getMessage(admin, "form.cancel"),
  rewardDialogCreate: getMessage(admin, "achievements.reward_dialog_create"),
  rewardDialogEdit: getMessage(admin, "achievements.reward_dialog_edit"),
  rewardDialogHint: getMessage(admin, "achievements.reward_dialog_hint"),
  penaltyDialogCreate: getMessage(admin, "achievements.penalty_dialog_create"),
  penaltyDialogEdit: getMessage(admin, "achievements.penalty_dialog_edit"),
  penaltyDialogHint: getMessage(admin, "achievements.penalty_dialog_hint"),
  fieldName: getMessage(admin, "achievements.field_name"),
  fieldNameEn: getMessage(admin, "achievements.field_name_en"),
  fieldCategory: getMessage(admin, "achievements.field_category"),
  fieldTiers: getMessage(admin, "achievements.field_tiers"),
  fieldTiersHint: getMessage(admin, "achievements.field_tiers_hint"),
  fieldTierPointsPlaceholder: getMessage(admin, "achievements.field_tier_points_placeholder"),
  fieldMaxPoints: getMessage(admin, "achievements.field_max_points"),
  fieldMaxPointsHint: getMessage(admin, "achievements.field_max_points_hint"),
  createSubmit: getMessage(admin, "achievements.create_submit"),
  saveSubmit: getMessage(admin, "achievements.save_submit"),
});
