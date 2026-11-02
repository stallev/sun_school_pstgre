import { SuggestionConfirmLabView } from "@/components/design-lab/SuggestionConfirmLabView.client";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickTeacherSuggestionMessages } from "@/lib/messages/pick-teacher-suggestion-messages.server";

/** Design Lab: pending-suggestions block and the verse list of the confirmation modal (screens spec 5.8). */
export const SuggestionConfirmLab = async () => {
  const messages = pickTeacherSuggestionMessages(await getDictionary("ru", "teacher"));
  return <SuggestionConfirmLabView messages={messages} />;
};
