import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

import { Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";

export type ForbiddenShellProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function ForbiddenShell({
  title,
  description,
  ctaLabel,
  ctaHref,
}: ForbiddenShellProps) {
  return (
    <Empty className="border border-border/60">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlertIcon aria-hidden />
        </EmptyMedia>
        <Heading as="h1" visualLevel="h2">
          {title}
        </Heading>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
