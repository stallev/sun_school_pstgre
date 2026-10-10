"use client";

import dynamic from "next/dynamic";

import { LandingSectionSkeleton } from "@/components/landing/LandingSectionSkeleton";

const LandingFaq = dynamic(
  () =>
    import("@/components/landing/LandingFaq.client").then((module) => ({
      default: module.LandingFaq,
    })),
  { loading: () => <LandingSectionSkeleton /> },
);

export function LandingFaqLazy() {
  return <LandingFaq />;
}
