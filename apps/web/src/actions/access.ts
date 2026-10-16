"use server";

import { redirect } from "next/navigation";
import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import { resubmitRegistration } from "@/data/access/resubmit-registration";
import { submitRegistration } from "@/data/access/submit-registration";
import { updateOwnName } from "@/data/access/update-own-name";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/db.server";
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
    redirect("/pending");
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
    redirect("/pending");
  }
  return result;
}

export async function updateOwnNameAction(_prev: MutationResult | null, formData: FormData): Promise<MutationResult> {
  const userId = await requireSessionUserId();
  if (!userId) return unauthorized();

  return updateOwnName(await getPrisma(), userId, nameFieldsFromForm(formData));
}
