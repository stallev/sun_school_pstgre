"use client";

import dynamic from "next/dynamic";

const LandingTrustBar = dynamic(
  () =>
    import("@/components/landing/LandingTrustBar.client").then((module) => ({
      default: module.LandingTrustBar,
    })),
  { ssr: true },
);

export function LandingTrustBarLazy() {
  return <LandingTrustBar />;
}
