"use client";

import { ArrowRightIcon } from "lucide-react";

import { CustomLink } from "@/components/ui/CustomLink";
import { Reveal } from "@/components/ui/Reveal.client";

type LandingFeaturedTrainersBrowseCtaProps = {
  label: string;
};

export function LandingFeaturedTrainersBrowseCta({
  label,
}: LandingFeaturedTrainersBrowseCtaProps) {
  return (
    <Reveal className="mt-10 text-center">
      <CustomLink
        as="button"
        href="/trainers"
        variant="outline"
        size="lg"
        className="rounded-full px-8"
        prefetch={true}
      >
        {label}
        <ArrowRightIcon aria-hidden className="size-[18px]" />
      </CustomLink>
    </Reveal>
  );
}
