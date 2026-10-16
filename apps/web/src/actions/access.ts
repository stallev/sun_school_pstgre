"use server";

import { redirect } from "next/navigation";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import { recordPrivacyConsent } from "@/data/access/record-privacy-consent.server";
import { resubmitRegistration } from "@/data/access/resubmit-registration";
import { submitRegistration } from "@/data/access/submit-registration";
import { updateOwnName } from "@/data/access/update-own-name";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/db.server";
import { homeRouteFor } from "@sunschool/policy-edge";
import { nameFieldsFromForm } from "@/lib/auth/name-fields-from-form";

const unauthorized = (): MutationResult => ({
  ok: false,
  code: MUTATION_ERROR_CODES.UNAUTHORIZED,
  message: "common.errors.unauthorized",
});

async function requireSessionUserId(): Promise<string | null> {
  const session = await auth();
  const uid = session?.user?.id;
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}

export async function submitRegistrationAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();

  const raw = {
    ...nameFieldsFromForm(formData),
    consentAccepted: formData.get("consentAccepted") === "true" || formData.get("consentAccepted") === "on",
  };

  const result = await submitRegistration(await getPrisma(), userId, raw, new Date());
  if (result.ok) {
    redirect("/pending?submitted=1");
  }
  return result;
}

export async function resubmitRegistrationAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();

  const raw = {
    ...nameFieldsFromForm(formData),
    consentAccepted: formData.get("consentAccepted") === "true" || formData.get("consentAccepted") === "on",
  };

  const result = await resubmitRegistration(await getPrisma(), userId, raw, new Date());
  if (result.ok) {
    redirect("/pending?submitted=1");
  }
  return result;
}

export async function updateOwnNameAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();

  return updateOwnName(await getPrisma(), userId, nameFieldsFromForm(formData));
}

export async function recordPrivacyConsentAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();

  const consentAccepted =
    formData.get("consentAccepted") === "true" || formData.get("consentAccepted") === "on";
  const result = await recordPrivacyConsent(await getPrisma(), userId, consentAccepted, new Date());
  if (!result.ok) return result;

  const db = await getPrisma();
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { status: true, roles: { select: { role: true } } },
  });
  if (!user) return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };

  redirect(homeRouteFor(user.status, user.roles.map((entry) => entry.role)));
}
