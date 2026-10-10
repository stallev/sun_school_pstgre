import { TrainerCardView, type TrainerCardViewProps } from "@/components/catalog/TrainerCardView";
import { getLocale, getMessages } from "@/lib/messages/server";

export type TrainerCardProps = Omit<TrainerCardViewProps, "messages" | "locale">;

export async function TrainerCard(props: TrainerCardProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return <TrainerCardView {...props} messages={messages} locale={locale} />;
}
