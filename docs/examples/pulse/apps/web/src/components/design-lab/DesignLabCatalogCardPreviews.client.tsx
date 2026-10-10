"use client";

import { FeaturedTrainerCardView } from "@/components/catalog/FeaturedTrainerCardView";
import { TrainerCardView } from "@/components/catalog/TrainerCardView";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";
import type { CatalogTrainerCard } from "@/lib/catalog/catalog-trainer-card";

type DesignLabCatalogCardPreviewsProps = {
  trainer: CatalogTrainerCard;
};

export function DesignLabFeaturedTrainerCardPreview({
  trainer,
}: DesignLabCatalogCardPreviewsProps) {
  const messages = useMessages();
  const locale = useLocale();

  return (
    <FeaturedTrainerCardView
      trainer={trainer}
      messages={messages}
      locale={locale}
    />
  );
}

export function DesignLabTrainerCardPreview({
  trainer,
}: DesignLabCatalogCardPreviewsProps) {
  const messages = useMessages();
  const locale = useLocale();

  return (
    <TrainerCardView trainer={trainer} messages={messages} locale={locale} />
  );
}
