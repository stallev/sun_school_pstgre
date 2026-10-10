"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher.client";
import { MarketingNavMobileMenu } from "@/components/landing/MarketingNavMobileMenu.client";
import { ThemeToggle } from "@/components/shell/ThemeToggle.client";
import { Button } from "@/components/ui/button";

const HOW_IT_WAS_BUILT_PATH = "/how-it-was-built";

type MarketingNavActionsProps = {
  linkLabels: {
    how: string;
    trainers: string;
    reviews: string;
    faq: string;
  };
  caseStudyLabel: string;
  getStartedLabel: string;
  signInLabel: string;
};

export function MarketingNavActions({
  linkLabels,
  caseStudyLabel,
  getStartedLabel,
  signInLabel,
}: MarketingNavActionsProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isCaseStudyPage = pathname === HOW_IT_WAS_BUILT_PATH;

  const anchorLinks = [
    { href: isLanding ? "#how" : "/#how", label: linkLabels.how },
    { href: isLanding ? "#trainers" : "/#trainers", label: linkLabels.trainers },
    { href: isLanding ? "#reviews" : "/#reviews", label: linkLabels.reviews },
    { href: isLanding ? "#faq" : "/#faq", label: linkLabels.faq },
  ] as const;

  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-2.5">
      <div className="flex items-center gap-1.5 md:hidden">
        <Button asChild size="sm" className="shrink-0 rounded-full px-4">
          <Link href="/auth/register">{getStartedLabel}</Link>
        </Button>
        <div className="flex min-h-11 min-w-11 shrink-0 items-center justify-center">
          <ThemeToggle size="icon" />
        </div>
        <MarketingNavMobileMenu
          anchorLinks={anchorLinks}
          caseStudyHref={HOW_IT_WAS_BUILT_PATH}
          caseStudyLabel={caseStudyLabel}
          isCaseStudyCurrent={isCaseStudyPage}
        />
      </div>

      <div className="hidden items-center gap-2.5 md:flex">
        <LocaleSwitcher variant="compact" />
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/auth/login">{signInLabel}</Link>
        </Button>
        <Button asChild size="sm" className="rounded-full px-[22px]">
          <Link href="/auth/register">{getStartedLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
