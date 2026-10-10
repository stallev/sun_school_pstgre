import type { ReactNode } from "react";

import { ContentText, Heading } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type HowItWasBuiltSectionProps = {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
};

export function HowItWasBuiltSection({
  id,
  title,
  intro,
  children,
  className,
}: HowItWasBuiltSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={cn("scroll-mt-28", className)}>
      <Heading as="h2" id={`${id}-heading`} visualLevel="h1" className="mb-4 text-2xl md:text-3xl">
        {title}
      </Heading>
      {intro ? (
        <ContentText variant="lead" as="p" className="mb-6 max-w-3xl">
          {intro}
        </ContentText>
      ) : null}
      {children}
    </section>
  );
}
