import { ArrowRightIcon } from "lucide-react";

import { CustomLink } from "@/components/ui/CustomLink";

export type LandingFeaturedTrainersBrowseCtaProps = {
  label: string;
};

export function LandingFeaturedTrainersBrowseCta({
  label,
}: LandingFeaturedTrainersBrowseCtaProps) {
  return (
    <div className="mt-10 text-center">
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
    </div>
  );
}
