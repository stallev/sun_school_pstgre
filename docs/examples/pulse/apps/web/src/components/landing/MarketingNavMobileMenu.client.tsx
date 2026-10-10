"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher.client";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type MarketingNavMobileMenuProps = {
  anchorLinks: readonly { href: string; label: string }[];
  caseStudyHref: string;
  caseStudyLabel: string;
  isCaseStudyCurrent: boolean;
};

const navLinkClassName =
  "flex min-h-11 items-center rounded-xl px-3 text-base font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MarketingNavMobileMenu({
  anchorLinks,
  caseStudyHref,
  caseStudyLabel,
  isCaseStudyCurrent,
}: MarketingNavMobileMenuProps) {
  const messages = useMessages();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11 shrink-0 rounded-full md:hidden"
          aria-label={messages.landing.nav.menuOpenLabel}
          aria-expanded={isOpen}
        >
          <MenuIcon aria-hidden className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto px-0">
        <SheetHeader className="px-5 pb-2">
          <SheetTitle>{messages.landing.nav.menuTitle}</SheetTitle>
        </SheetHeader>
        <nav
          aria-label={messages.locale.navAriaLabel}
          className="flex flex-col px-3 pb-2"
        >
          <ul className="list-none p-0">
            {anchorLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={navLinkClassName} onClick={handleNavigate}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {isCaseStudyCurrent ? (
                <span
                  aria-current="page"
                  className={cn(navLinkClassName, "text-primary")}
                >
                  {caseStudyLabel}
                </span>
              ) : (
                <Link
                  href={caseStudyHref}
                  className={navLinkClassName}
                  onClick={handleNavigate}
                >
                  {caseStudyLabel}
                </Link>
              )}
            </li>
          </ul>
        </nav>
        <Separator className="mx-5" />
        <div className="flex flex-col gap-4 px-5 py-4">
          <Button asChild variant="outline" className="min-h-11 w-full rounded-full">
            <Link href="/auth/login" onClick={handleNavigate}>
              {messages.landing.nav.signIn}
            </Link>
          </Button>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {messages.locale.settingsLabel}
            </span>
            <LocaleSwitcher variant="footer" className="w-full justify-center" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
