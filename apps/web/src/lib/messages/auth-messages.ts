import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";

/** Serializable auth-route copy for client components (ui-messages-bundle-splitting). */
export type AuthMessages = {
  login: {
    title: string;
    intro: string;
    telegram: string;
    telegramPending: string;
    divider: string;
    adminTitle: string;
    email: string;
    password: string;
    submit: string;
    submitPending: string;
    adminNote: string;
    adminHide: string;
    privacyLink: string;
    devBanner: string;
    cancelled: string;
    account_conflict: string;
    denied: string;
    failed: string;
    bad_credentials: string;
    locked: string;
  };
  register: {
    titleNew: string;
    titleResubmit: string;
    titleConsent: string;
    stepData: string;
    stepConsent: string;
    lastName: string;
    firstName: string;
    middleName: string;
    middleNameOptional: string;
    consentChildrenNote: string;
    submit: string;
    resubmit: string;
    confirmConsent: string;
    submitPending: string;
    consent_required: string;
    err_name: string;
    err_chars: string;
    toastSubmitted: string;
    showFullConsent: string;
    hideFullConsent: string;
  };
  pending: {
    titlePending: string;
    titleRejected: string;
    checkStatus: string;
    checkStatusPending: string;
    fixAndResubmit: string;
    profile: string;
    stepSignIn: string;
    stepConsent: string;
    stepReview: string;
    stepAfterApprove: string;
  };
  privacy: {
    title: string;
    backToLogin: string;
    versionLabel: string;
  };
  errors: {
    status_invalid: string;
    form: string;
  };
  profile: {
    title: string;
    backToPending: string;
    rolesLabel: string;
    statusLabel: string;
    roleAdmin: string;
    roleTeacher: string;
    statusActive: string;
    statusRequestPending: string;
    statusRejected: string;
    nameSection: string;
    save: string;
    savePending: string;
    savedToast: string;
    identitiesSection: string;
    identitiesHint: string;
    telegramTitle: string;
    credentialsTitle: string;
    connected: string;
    notConnected: string;
    connect: string;
    connectPending: string;
    disconnect: string;
    disconnectPending: string;
    lastIdentityHint: string;
    unlinkConfirmTitle: string;
    unlinkConfirmBody: string;
    unlinkConfirm: string;
    unlinkCancel: string;
    unlinkedToast: string;
    linkedToast: string;
    linkConflict: string;
    linkForbidden: string;
    unlinkForbidden: string;
    lastIdentity: string;
    consentSection: string;
    consentLine: string;
    uiLocaleSection: string;
    uiLocaleValue: string;
    localeRu: string;
    localeEn: string;
    deletionSection: string;
    deletionIntro: string;
    deletionRequestBtn: string;
    deletionCancelBtn: string;
    deletionReasonLabel: string;
    deletionReasonOptional: string;
    deletionPending: string;
    deletionSubmitPending: string;
    deletionToastCreated: string;
    deletionToastCancelled: string;
    signOut: string;
  };
};

export const pickAuthMessages = (auth: Dictionary): AuthMessages => ({
  login: {
    title: getMessage(auth, "login.title"),
    intro: getMessage(auth, "login.intro"),
    telegram: getMessage(auth, "login.telegram"),
    telegramPending: getMessage(auth, "login.telegram_pending"),
    divider: getMessage(auth, "login.divider"),
    adminTitle: getMessage(auth, "login.admin_title"),
    email: getMessage(auth, "login.email"),
    password: getMessage(auth, "login.password"),
    submit: getMessage(auth, "login.submit"),
    submitPending: getMessage(auth, "login.submit_pending"),
    adminNote: getMessage(auth, "login.admin_note"),
    adminHide: getMessage(auth, "login.admin_hide"),
    privacyLink: getMessage(auth, "login.privacy_link"),
    devBanner: getMessage(auth, "login.dev_banner"),
    cancelled: getMessage(auth, "login.cancelled"),
    account_conflict: getMessage(auth, "login.account_conflict"),
    denied: getMessage(auth, "login.denied"),
    failed: getMessage(auth, "login.failed"),
    bad_credentials: getMessage(auth, "login.bad_credentials"),
    locked: getMessage(auth, "login.locked"),
  },
  register: {
    titleNew: getMessage(auth, "register.title_new"),
    titleResubmit: getMessage(auth, "register.title_resubmit"),
    titleConsent: getMessage(auth, "register.title_consent"),
    stepData: getMessage(auth, "register.step_data"),
    stepConsent: getMessage(auth, "register.step_consent"),
    lastName: getMessage(auth, "register.last_name"),
    firstName: getMessage(auth, "register.first_name"),
    middleName: getMessage(auth, "register.middle_name"),
    middleNameOptional: getMessage(auth, "register.middle_name_optional"),
    consentChildrenNote: getMessage(auth, "register.consent_children_note"),
    submit: getMessage(auth, "register.submit"),
    resubmit: getMessage(auth, "register.resubmit"),
    confirmConsent: getMessage(auth, "register.confirm_consent"),
    submitPending: getMessage(auth, "register.submit_pending"),
    consent_required: getMessage(auth, "register.consent_required"),
    err_name: getMessage(auth, "register.err_name"),
    err_chars: getMessage(auth, "register.err_chars"),
    toastSubmitted: getMessage(auth, "register.toast_submitted"),
    showFullConsent: getMessage(auth, "register.show_full_consent"),
    hideFullConsent: getMessage(auth, "register.hide_full_consent"),
  },
  pending: {
    titlePending: getMessage(auth, "pending.title_pending"),
    titleRejected: getMessage(auth, "pending.title_rejected"),
    checkStatus: getMessage(auth, "pending.check_status"),
    checkStatusPending: getMessage(auth, "pending.check_status_pending"),
    fixAndResubmit: getMessage(auth, "pending.fix_and_resubmit"),
    profile: getMessage(auth, "pending.profile"),
    stepSignIn: getMessage(auth, "pending.step_sign_in"),
    stepConsent: getMessage(auth, "pending.step_consent"),
    stepReview: getMessage(auth, "pending.step_review"),
    stepAfterApprove: getMessage(auth, "pending.step_after_approve"),
  },
  privacy: {
    title: getMessage(auth, "privacy.title"),
    backToLogin: getMessage(auth, "privacy.back_to_login"),
    versionLabel: getMessage(auth, "privacy.version_label"),
  },
  errors: {
    status_invalid: getMessage(auth, "errors.status_invalid"),
    form: getMessage(auth, "errors.form"),
  },
  profile: {
    title: getMessage(auth, "profile.title"),
    backToPending: getMessage(auth, "profile.back_to_pending"),
    rolesLabel: getMessage(auth, "profile.roles_label"),
    statusLabel: getMessage(auth, "profile.status_label"),
    roleAdmin: getMessage(auth, "profile.role_admin"),
    roleTeacher: getMessage(auth, "profile.role_teacher"),
    statusActive: getMessage(auth, "profile.status_active"),
    statusRequestPending: getMessage(auth, "profile.status_request_pending"),
    statusRejected: getMessage(auth, "profile.status_rejected"),
    nameSection: getMessage(auth, "profile.name_section"),
    save: getMessage(auth, "profile.save"),
    savePending: getMessage(auth, "profile.save_pending"),
    savedToast: getMessage(auth, "profile.saved_toast"),
    identitiesSection: getMessage(auth, "profile.identities_section"),
    identitiesHint: getMessage(auth, "profile.identities_hint"),
    telegramTitle: getMessage(auth, "profile.telegram_title"),
    credentialsTitle: getMessage(auth, "profile.credentials_title"),
    connected: getMessage(auth, "profile.connected"),
    notConnected: getMessage(auth, "profile.not_connected"),
    connect: getMessage(auth, "profile.connect"),
    connectPending: getMessage(auth, "profile.connect_pending"),
    disconnect: getMessage(auth, "profile.disconnect"),
    disconnectPending: getMessage(auth, "profile.disconnect_pending"),
    lastIdentityHint: getMessage(auth, "profile.last_identity_hint"),
    unlinkConfirmTitle: getMessage(auth, "profile.unlink_confirm_title"),
    unlinkConfirmBody: getMessage(auth, "profile.unlink_confirm_body"),
    unlinkConfirm: getMessage(auth, "profile.unlink_confirm"),
    unlinkCancel: getMessage(auth, "profile.unlink_cancel"),
    unlinkedToast: getMessage(auth, "profile.unlinked_toast"),
    linkedToast: getMessage(auth, "profile.linked_toast"),
    linkConflict: getMessage(auth, "profile.link_conflict"),
    linkForbidden: getMessage(auth, "profile.link_forbidden"),
    unlinkForbidden: getMessage(auth, "profile.unlink_forbidden"),
    lastIdentity: getMessage(auth, "profile.last_identity"),
    consentSection: getMessage(auth, "profile.consent_section"),
    consentLine: getMessage(auth, "profile.consent_line"),
    uiLocaleSection: getMessage(auth, "profile.ui_locale_section"),
    uiLocaleValue: getMessage(auth, "profile.ui_locale_value"),
    localeRu: getMessage(auth, "profile.locale_ru"),
    localeEn: getMessage(auth, "profile.locale_en"),
    deletionSection: getMessage(auth, "profile.deletion_section"),
    deletionIntro: getMessage(auth, "profile.deletion_intro"),
    deletionRequestBtn: getMessage(auth, "profile.deletion_request_btn"),
    deletionCancelBtn: getMessage(auth, "profile.deletion_cancel_btn"),
    deletionReasonLabel: getMessage(auth, "profile.deletion_reason_label"),
    deletionReasonOptional: getMessage(auth, "profile.deletion_reason_optional"),
    deletionPending: getMessage(auth, "profile.deletion_pending"),
    deletionSubmitPending: getMessage(auth, "profile.deletion_submit_pending"),
    deletionToastCreated: getMessage(auth, "profile.deletion_toast_created"),
    deletionToastCancelled: getMessage(auth, "profile.deletion_toast_cancelled"),
    signOut: getMessage(auth, "profile.sign_out"),
  },
});
