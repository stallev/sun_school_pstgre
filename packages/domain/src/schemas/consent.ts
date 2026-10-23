import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "admin.people.consent_date_format" });

export const recordPaperConsentInputSchema = z
  .object({
    pupilId: z.uuid(),
    signerName: z.string().trim().min(1, { error: "admin.people.signer_required" }).max(200),
    signedOn: isoDateSchema,
    textVersion: z.string().trim().min(1, { error: "admin.people.consent_version_required" }).max(50),
    storageNote: z.string().trim().max(500).optional(),
  })
  .strict();

export type RecordPaperConsentInput = z.infer<typeof recordPaperConsentInputSchema>;

export const revokeConsentInputSchema = z
  .object({
    consentId: z.uuid(),
    reason: z.string().trim().min(1, { error: "common.errors.reason_required" }).max(500),
  })
  .strict();

export type RevokeConsentInput = z.infer<typeof revokeConsentInputSchema>;

export const extendLegacyDeadlineInputSchema = z
  .object({
    newDeadlineOn: isoDateSchema,
    reason: z.string().trim().min(1, { error: "common.errors.reason_required" }).max(500),
  })
  .strict();

export type ExtendLegacyDeadlineInput = z.infer<typeof extendLegacyDeadlineInputSchema>;

export const giveElectronicConsentInputSchema = z
  .object({
    pupilId: z.uuid(),
    accepted: z.literal(true, { error: "parent.consent.required" }),
  })
  .strict();

export type GiveElectronicConsentInput = z.infer<typeof giveElectronicConsentInputSchema>;

export const revokeElectronicConsentInputSchema = z
  .object({
    pupilId: z.uuid(),
    confirmDeletion: z.boolean(),
  })
  .strict();

export type RevokeElectronicConsentInput = z.infer<typeof revokeElectronicConsentInputSchema>;
