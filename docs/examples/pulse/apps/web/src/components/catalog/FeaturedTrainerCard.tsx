import {
  FeaturedTrainerCardView,
  type FeaturedTrainerCardViewProps,
} from "@/components/catalog/FeaturedTrainerCardView";
import { getLocale, getMessages } from "@/lib/messages/server";

export type FeaturedTrainerCardProps = Omit<
  FeaturedTrainerCardViewProps,
  "messages" | "locale"
>;

export async function FeaturedTrainerCard(props: FeaturedTrainerCardProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <FeaturedTrainerCardView {...props} messages={messages} locale={locale} />
  );
}
