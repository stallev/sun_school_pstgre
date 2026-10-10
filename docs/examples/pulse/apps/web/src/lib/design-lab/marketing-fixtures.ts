import type { CatalogTrainerCard } from "@/lib/catalog/catalog-trainer-card";
import type { StatsBarMetric } from "@/components/ui/StatsBar.client";
import type { MarketingAccordionItem } from "@/components/ui/MarketingAccordion.client";

export const LANDING_TRAINER_FIXTURE: CatalogTrainerCard = {
  id: "lab-trainer-1",
  fullName: "Maria Pilates",
  bio: "Pilates & Flexibility",
  photoUrl: null,
  ratingAvg: 5,
  ratingCount: 12,
  experienceYears: 6,
  specializations: [
    { slug: "pilates", name: "Pilates" },
    { slug: "stretching", name: "Stretching" },
  ],
  fromPriceCents: 3200,
  currency: "USD",
};

export const LANDING_SPECIALTY_FIXTURE = [
  { slug: "personal-training", label: "Personal Training", count: "64 trainers" },
  { slug: "cardio", label: "Cardio", count: "48 trainers" },
  { slug: "pilates", label: "Pilates", count: "35 trainers" },
  { slug: "hiit", label: "HIIT", count: "29 trainers" },
] as const;

export const LANDING_STATS_FIXTURE: StatsBarMetric[] = [
  {
    id: "trainers",
    target: 200,
    label: "Certified Trainers",
  },
  {
    id: "sessions",
    target: 10000,
    label: "Sessions Booked",
  },
  {
    id: "satisfaction",
    target: 98,
    format: (value) => `${value}%`,
    label: "Client Satisfaction",
  },
  {
    id: "rating",
    target: 49,
    format: (value) => `${(value / 10).toFixed(1)}★`,
    label: "Average Rating",
  },
];

export const LANDING_FAQ_FIXTURE: MarketingAccordionItem[] = [
  {
    id: "faq-1",
    question: "Are all trainers background-checked and certified?",
    answer:
      "Yes. Every trainer undergoes identity verification, credential confirmation, and screening.",
  },
  {
    id: "faq-2",
    question: "How do online sessions work?",
    answer:
      "Sessions happen at the scheduled time with automatic reminders — no third-party apps required on MVP.",
  },
  {
    id: "faq-3",
    question: "Can I cancel or reschedule a session?",
    answer:
      "Yes. You can cancel or reschedule up to 24 hours before your session at no charge.",
  },
];
