import type { Dictionary } from "@/lib/messages/dictionary-types";
import { ANALYTICS_HINT_KEYS } from "@/lib/messages/analytics-hints-types";
import { pickHintsMessages } from "@/lib/messages/pick-hints-messages";

export const pickAnalyticsHintsMessages = (analytics: Dictionary) =>
  pickHintsMessages(analytics, ANALYTICS_HINT_KEYS);

export type AnalyticsHintsMessages = ReturnType<typeof pickAnalyticsHintsMessages>;
