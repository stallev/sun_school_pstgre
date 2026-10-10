"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HOW_IT_WAS_BUILT_PATH = "/how-it-was-built";

type MarketingNavDesktopLinksProps = {
  linkLabels: {
    how: string;
    trainers: string;
    reviews: string;
    faq: string;
  };
  caseStudyLabel: string;
};

export function MarketingNavDesktopLinks({
  linkLabels,
  caseStudyLabel,
}: MarketingNavDesktopLinksProps) {
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
    <ul className="hidden list-none gap-8 md:flex">
      {anchorLinks.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
      <li>
        {isCaseStudyPage ? (
          <span
            aria-current="page"
            className="text-sm font-medium whitespace-nowrap text-primary"
          >
            {caseStudyLabel}
          </span>
        ) : (
          <Link
            href={HOW_IT_WAS_BUILT_PATH}
            className="text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-primary"
          >
            {caseStudyLabel}
          </Link>
        )}
      </li>
    </ul>
  );
}
