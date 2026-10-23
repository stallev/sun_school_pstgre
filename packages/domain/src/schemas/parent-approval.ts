import { z } from "zod";
import { ADULT_RELATION } from "../constants/enums";
import { PARENT_APPROVAL_LINK_MODE } from "../constants/parent-approval-link-mode";

const adultRelationSchema = z.enum([
  ADULT_RELATION.MOTHER,
  ADULT_RELATION.FATHER,
  ADULT_RELATION.GUARDIAN,
]);

export const approveParentLinkInputSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal(PARENT_APPROVAL_LINK_MODE.LINK_EXISTING_ADULT),
      adultId: z.uuid(),
    })
    .strict(),
  z
    .object({
      mode: z.literal(PARENT_APPROVAL_LINK_MODE.JOIN_CHILD_FAMILY),
      pupilId: z.uuid(),
      relation: adultRelationSchema,
    })
    .strict(),
  z
    .object({
      mode: z.literal(PARENT_APPROVAL_LINK_MODE.CREATE_FAMILY),
      pupilIds: z.array(z.uuid()).min(1),
      familyName: z.string().trim().min(1).optional(),
      relation: adultRelationSchema,
    })
    .strict(),
]);

export type ApproveParentLinkInput = z.infer<typeof approveParentLinkInputSchema>;
