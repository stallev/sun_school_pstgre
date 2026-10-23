import type { Dictionary } from "@/lib/messages/dictionary-types";
import { getMessage } from "@/lib/messages/get-dictionary";

export type ParentMessages = {
  child: {
    pageTitle: string;
    pageSubtitle: string;
    emptyTitle: string;
    emptyDescription: string;
    consentCta: string;
    switchLabel: string;
    bricksTitle: string;
    bricksEarned: string;
    bricksIssued: string;
    bricksPending: string;
    attendanceTitle: string;
    attendanceSummary: string;
    subjectsTitle: string;
    achievementsTitle: string;
    achievementsOff: string;
    penaltiesTitle: string;
    penaltiesHint: string;
    digestTitle: string;
    digestEmpty: string;
    digestAward: string;
    digestPenalty: string;
    digestLate: string;
  };
  data: {
    pageTitle: string;
    pageSubtitle: string;
    contactsTitle: string;
    phonesLabel: string;
    emailLabel: string;
    familyTitle: string;
    familyReadonly: string;
    consentsTitle: string;
    childDataConsent: string;
    childDataActive: string;
    childDataMissing: string;
    revokeConsent: string;
    deletionTitle: string;
    deletionHint: string;
    deletionOpen: string;
    deletionRequest: string;
    deletionCancel: string;
    save: string;
    toastContactsSaved: string;
  };
  consent: {
    pageTitle: string;
    intro: string;
    bulletStorage: string;
    bulletWhoSees: string;
    bulletWithout: string;
    bulletRevoke: string;
    fullTextToggle: string;
    fullTextPlaceholder: string;
    checkbox: string;
    decline: string;
    submit: string;
    required: string;
    givenToast: string;
    revokedToast: string;
  };
  deletion: {
    createdToast: string;
    cancelledToast: string;
  };
  calendar: {
    pageSubtitle: string;
  };
};

export const pickParentMessages = (parentDict: Dictionary): ParentMessages => ({
  child: {
    pageTitle: getMessage(parentDict, "child.page_title"),
    pageSubtitle: getMessage(parentDict, "child.page_subtitle"),
    emptyTitle: getMessage(parentDict, "child.empty_title"),
    emptyDescription: getMessage(parentDict, "child.empty_description"),
    consentCta: getMessage(parentDict, "child.consent_cta"),
    switchLabel: getMessage(parentDict, "child.switch_label"),
    bricksTitle: getMessage(parentDict, "child.bricks_title"),
    bricksEarned: getMessage(parentDict, "child.bricks_earned"),
    bricksIssued: getMessage(parentDict, "child.bricks_issued"),
    bricksPending: getMessage(parentDict, "child.bricks_pending"),
    attendanceTitle: getMessage(parentDict, "child.attendance_title"),
    attendanceSummary: getMessage(parentDict, "child.attendance_summary"),
    subjectsTitle: getMessage(parentDict, "child.subjects_title"),
    achievementsTitle: getMessage(parentDict, "child.achievements_title"),
    achievementsOff: getMessage(parentDict, "child.achievements_off"),
    penaltiesTitle: getMessage(parentDict, "child.penalties_title"),
    penaltiesHint: getMessage(parentDict, "child.penalties_hint"),
    digestTitle: getMessage(parentDict, "child.digest_title"),
    digestEmpty: getMessage(parentDict, "child.digest_empty"),
    digestAward: getMessage(parentDict, "child.digest_award"),
    digestPenalty: getMessage(parentDict, "child.digest_penalty"),
    digestLate: getMessage(parentDict, "child.digest_late"),
  },
  data: {
    pageTitle: getMessage(parentDict, "data.page_title"),
    pageSubtitle: getMessage(parentDict, "data.page_subtitle"),
    contactsTitle: getMessage(parentDict, "data.contacts_title"),
    phonesLabel: getMessage(parentDict, "data.phones_label"),
    emailLabel: getMessage(parentDict, "data.email_label"),
    familyTitle: getMessage(parentDict, "data.family_title"),
    familyReadonly: getMessage(parentDict, "data.family_readonly"),
    consentsTitle: getMessage(parentDict, "data.consents_title"),
    childDataConsent: getMessage(parentDict, "data.child_data_consent"),
    childDataActive: getMessage(parentDict, "data.child_data_active"),
    childDataMissing: getMessage(parentDict, "data.child_data_missing"),
    revokeConsent: getMessage(parentDict, "data.revoke_consent"),
    deletionTitle: getMessage(parentDict, "data.deletion_title"),
    deletionHint: getMessage(parentDict, "data.deletion_hint"),
    deletionOpen: getMessage(parentDict, "data.deletion_open"),
    deletionRequest: getMessage(parentDict, "data.deletion_request"),
    deletionCancel: getMessage(parentDict, "data.deletion_cancel"),
    save: getMessage(parentDict, "data.save"),
    toastContactsSaved: getMessage(parentDict, "data.toast_contacts_saved"),
  },
  consent: {
    pageTitle: getMessage(parentDict, "consent.page_title"),
    intro: getMessage(parentDict, "consent.intro"),
    bulletStorage: getMessage(parentDict, "consent.bullet_storage"),
    bulletWhoSees: getMessage(parentDict, "consent.bullet_who_sees"),
    bulletWithout: getMessage(parentDict, "consent.bullet_without"),
    bulletRevoke: getMessage(parentDict, "consent.bullet_revoke"),
    fullTextToggle: getMessage(parentDict, "consent.full_text_toggle"),
    fullTextPlaceholder: getMessage(parentDict, "consent.full_text_placeholder"),
    checkbox: getMessage(parentDict, "consent.checkbox"),
    decline: getMessage(parentDict, "consent.decline"),
    submit: getMessage(parentDict, "consent.submit"),
    required: getMessage(parentDict, "consent.required"),
    givenToast: getMessage(parentDict, "consent.given_toast"),
    revokedToast: getMessage(parentDict, "consent.revoked_toast"),
  },
  deletion: {
    createdToast: getMessage(parentDict, "deletion.created_toast"),
    cancelledToast: getMessage(parentDict, "deletion.cancelled_toast"),
  },
  calendar: {
    pageSubtitle: getMessage(parentDict, "calendar.page_subtitle"),
  },
});
