import type { CSSProperties } from "react";

import type { Messages } from "@/lib/messages/types";

export type LandingHeroFloatCardTone = "forest" | "gold" | "slate";

export type LandingHeroFloatCardData = {
  id: string;
  name: string;
  spec: string;
  cert: string;
  rating: string;
  price: string;
  initials: string;
  tone: LandingHeroFloatCardTone;
  style: CSSProperties;
};

type LandingHeroFloatCardSeed = Omit<LandingHeroFloatCardData, "price"> & {
  priceAmount: string;
};

const LANDING_HERO_FLOAT_CARD_SEEDS: LandingHeroFloatCardSeed[] = [
  {
    id: "float-1",
    name: "Maria P.",
    spec: "Cardio & Pilates",
    cert: "NASM-CPT",
    rating: "5.0",
    priceAmount: "$32",
    initials: "MP",
    tone: "forest",
    style: {
      position: "absolute",
      top: "10px",
      left: "0px",
      transform: "rotate(-4.5deg)",
      zIndex: 1,
      width: "215px",
    },
  },
  {
    id: "float-2",
    name: "Anna V.",
    spec: "Stretching",
    cert: "ACE-CPT",
    rating: "4.8",
    priceAmount: "$35",
    initials: "AV",
    tone: "gold",
    style: {
      position: "absolute",
      top: "90px",
      left: "150px",
      transform: "rotate(2.5deg)",
      zIndex: 3,
      width: "215px",
    },
  },
  {
    id: "float-3",
    name: "Sergey K.",
    spec: "Strength",
    cert: "NSCA-CSCS",
    rating: "4.9",
    priceAmount: "$48",
    initials: "SK",
    tone: "slate",
    style: {
      position: "absolute",
      top: "265px",
      left: "22px",
      transform: "rotate(-1.5deg)",
      zIndex: 2,
      width: "215px",
    },
  },
];

export function getLandingHeroFloatCards(
  messages: Messages,
): LandingHeroFloatCardData[] {
  const priceTemplate = messages.landing.hero.floatCardPrice;

  return LANDING_HERO_FLOAT_CARD_SEEDS.map(({ priceAmount, ...card }) => ({
    ...card,
    price: `${priceTemplate.replace("{amount}", priceAmount)}${messages.common.perHourSuffix}`,
  }));
}
