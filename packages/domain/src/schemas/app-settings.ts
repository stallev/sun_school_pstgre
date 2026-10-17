import { z } from "zod";
import { UI_MESSAGE_LOCALES } from "../settings/locale";

export const updateAppLanguageInputSchema = z
  .object({
    locale: z.enum(UI_MESSAGE_LOCALES),
  })
  .strict();

export type UpdateAppLanguageInput = z.infer<typeof updateAppLanguageInputSchema>;

export const updateSchoolTimezoneInputSchema = z
  .object({
    timeZone: z.string().trim().min(1, { error: "admin.settings.timezone_required" }),
  })
  .strict();

export type UpdateSchoolTimezoneInput = z.infer<typeof updateSchoolTimezoneInputSchema>;
