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
});
