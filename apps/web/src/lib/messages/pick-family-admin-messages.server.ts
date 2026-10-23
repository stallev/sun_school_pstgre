import "server-only";

import { ADULT_RELATION } from "@sunschool/domain";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";

export type FamilyAdminMessages = {
  pageTitle: string;
  pageSubtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  createAction: string;
  unassignedNote: string;
  noAdults: string;
  noChildren: string;
  listAdultSignedIn: string;
  listAdultNoAccount: string;
  listNoConsent: string;
  backToList: string;
  createdLabel: string;
  editAction: string;
  sectionAdults: string;
  sectionChildren: string;
  addAdult: string;
  addChild: string;
  noContacts: string;
  noAccountHint: string;
  userProfileLink: string;
  editAdult: string;
  removeAdult: string;
  removeChild: string;
  paperConsent: string;
  fieldName: string;
  fieldAddress: string;
  fieldAddressOptional: string;
  fieldNote: string;
  fieldNoteHint: string;
  fieldRelation: string;
  fieldPhones: string;
  fieldPhonesHint: string;
  fieldEmail: string;
  relationLabels: Record<string, string>;
  metaAddress: string;
  metaNote: string;
  metaTeacherVisibility: string;
  metaTeacherVisibilityValue: string;
  sectionJournal: string;
  adultsEmptyWarn: string;
  childrenEmptyWarn: string;
  consentOkElectronic: string;
  consentOkPaper: string;
  consentMissing: string;
  consentCardOnly: string;
  dialogFamilyCreate: string;
  dialogFamilyEdit: string;
  dialogFamilyCreateHint: string;
  dialogAdultCreate: string;
  dialogAdultEdit: string;
  dialogAdultHint: string;
  dialogChildAdd: string;
  dialogChildAddHint: string;
  dialogChildEmpty: string;
  confirmRemoveAdultTitle: string;
  confirmRemoveChildTitle: string;
  confirmRemoveAdultBody: string;
  confirmRemoveChildBody: string;
  createSubmit: string;
  saveSubmit: string;
  addSubmit: string;
  submitPending: string;
  toastSaved: string;
  toastAdultSaved: string;
  toastAdultRemoved: string;
  toastChildAttached: string;
  toastChildDetached: string;
  toastCreated: string;
  formError: string;
  closeLabel: string;
  cancelLabel: string;
  lastName: string;
  firstName: string;
  middleName: string;
};

export const pickFamilyAdminMessages = (
  admin: Dictionary,
  common: Dictionary,
): FamilyAdminMessages => ({
  pageTitle: getMessage(admin, "page.family_title"),
  pageSubtitle: getMessage(admin, "family.page_subtitle"),
  emptyTitle: getMessage(admin, "family.empty_title"),
  emptyDescription: getMessage(admin, "family.empty_description"),
  createAction: getMessage(admin, "family.create_action"),
  unassignedNote: getMessage(admin, "family.unassigned_note"),
  noAdults: getMessage(admin, "family.no_adults"),
  noChildren: getMessage(admin, "family.no_children"),
  listAdultSignedIn: getMessage(admin, "family.list_adult_signed_in"),
  listAdultNoAccount: getMessage(admin, "family.list_adult_no_account"),
  listNoConsent: getMessage(admin, "family.list_no_consent"),
  backToList: getMessage(admin, "family.back_to_list"),
  createdLabel: getMessage(admin, "family.created_label"),
  editAction: getMessage(admin, "family.edit_action"),
  sectionAdults: getMessage(admin, "family.section_adults"),
  sectionChildren: getMessage(admin, "family.section_children"),
  addAdult: getMessage(admin, "family.add_adult"),
  addChild: getMessage(admin, "family.add_child"),
  noContacts: getMessage(admin, "family.no_contacts"),
  noAccountHint: getMessage(admin, "family.no_account_hint"),
  userProfileLink: getMessage(admin, "family.user_profile_link"),
  editAdult: getMessage(admin, "family.edit_adult"),
  removeAdult: getMessage(admin, "family.remove_adult"),
  removeChild: getMessage(admin, "family.remove_child"),
  paperConsent: getMessage(admin, "family.paper_consent"),
  fieldName: getMessage(admin, "family.field_name"),
  fieldAddress: getMessage(admin, "family.field_address"),
  fieldAddressOptional: getMessage(admin, "family.field_address_optional"),
  fieldNote: getMessage(admin, "family.field_note"),
  fieldNoteHint: getMessage(admin, "family.field_note_hint"),
  fieldRelation: getMessage(admin, "family.field_relation"),
  fieldPhones: getMessage(admin, "family.field_phones"),
  fieldPhonesHint: getMessage(admin, "family.field_phones_hint"),
  fieldEmail: getMessage(admin, "family.field_email"),
  relationLabels: {
    [ADULT_RELATION.MOTHER]: getMessage(admin, "family.relation_mother"),
    [ADULT_RELATION.FATHER]: getMessage(admin, "family.relation_father"),
    [ADULT_RELATION.GUARDIAN]: getMessage(admin, "family.relation_guardian"),
  },
  metaAddress: getMessage(admin, "family.meta_address"),
  metaNote: getMessage(admin, "family.meta_note"),
  metaTeacherVisibility: getMessage(admin, "family.meta_teacher_visibility"),
  metaTeacherVisibilityValue: getMessage(admin, "family.meta_teacher_visibility_value"),
  sectionJournal: getMessage(admin, "family.section_journal"),
  adultsEmptyWarn: getMessage(admin, "family.adults_empty_warn"),
  childrenEmptyWarn: getMessage(admin, "family.children_empty_warn"),
  consentOkElectronic: getMessage(admin, "family.consent_ok_electronic"),
  consentOkPaper: getMessage(admin, "family.consent_ok_paper"),
  consentMissing: getMessage(admin, "family.consent_missing"),
  consentCardOnly: getMessage(admin, "family.consent_card_only"),
  dialogFamilyCreate: getMessage(admin, "family.dialog_family_create"),
  dialogFamilyEdit: getMessage(admin, "family.dialog_family_edit"),
  dialogFamilyCreateHint: getMessage(admin, "family.dialog_family_create_hint"),
  dialogAdultCreate: getMessage(admin, "family.dialog_adult_create"),
  dialogAdultEdit: getMessage(admin, "family.dialog_adult_edit"),
  dialogAdultHint: getMessage(admin, "family.dialog_adult_hint"),
  dialogChildAdd: getMessage(admin, "family.dialog_child_add"),
  dialogChildAddHint: getMessage(admin, "family.dialog_child_add_hint"),
  dialogChildEmpty: getMessage(admin, "family.dialog_child_empty"),
  confirmRemoveAdultTitle: getMessage(admin, "family.confirm_remove_adult_title"),
  confirmRemoveChildTitle: getMessage(admin, "family.confirm_remove_child_title"),
  confirmRemoveAdultBody: getMessage(admin, "family.confirm_remove_adult_body"),
  confirmRemoveChildBody: getMessage(admin, "family.confirm_remove_child_body"),
  createSubmit: getMessage(admin, "family.create_submit"),
  saveSubmit: getMessage(admin, "family.save_submit"),
  addSubmit: getMessage(admin, "family.add_submit"),
  submitPending: getMessage(admin, "family.submit_pending"),
  toastSaved: getMessage(admin, "family.toast_saved"),
  toastAdultSaved: getMessage(admin, "family.toast_adult_saved"),
  toastAdultRemoved: getMessage(admin, "family.toast_adult_removed"),
  toastChildAttached: getMessage(admin, "family.toast_child_attached"),
  toastChildDetached: getMessage(admin, "family.toast_child_detached"),
  toastCreated: getMessage(admin, "family.toast_created"),
  formError: getMessage(common, "errors.form"),
  closeLabel: getMessage(common, "shell.close"),
  cancelLabel: getMessage(admin, "form.cancel"),
  lastName: getMessage(admin, "form.last_name"),
  firstName: getMessage(admin, "form.first_name"),
  middleName: getMessage(admin, "form.middle_name"),
});
