import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { CtaBand } from "@/components/ui/CtaBand";
import { CustomLink } from "@/components/ui/CustomLink";
import { TrustFeaturePill } from "@/components/ui/TrustFeaturePill";
import { getMessages } from "@/lib/messages/server";


export async function LandingFinalCta() {
  const messages = await getMessages();
  const { final } = messages.landing;

  return (
    <CtaBand
      eyebrow={final.eyebrow}
      title={
        <>
          {final.title}{" "}
          <em className="text-[hsl(var(--color-secondary-light))] not-italic">
            {final.titleAccent}
          </em>
        </>
      }
      description={final.description}
      actions={
        <>
          <CustomLink
            as="button"
            href="/trainers"
            variant="secondary"
            size="lg"
            className="rounded-full px-9"
            prefetch={true}
          >
            {final.primaryCta}
            <ArrowRightIcon aria-hidden className="size-[18px]" />
          </CustomLink>
          <CustomLink
            as="button"
            href="/auth/register/trainer"
            variant="outline"
            size="lg"
            className="rounded-full border-[hsl(var(--color-on-brand-cta-band)/0.35)] bg-transparent px-8 text-on-brand-cta-band hover:bg-[hsl(var(--color-on-brand-cta-band)/0.1)]"
          >
            {final.secondaryCta}
          </CustomLink>
        </>
      }
      footnotes={
        <>
          {final.footnotes.map((note) => (
            <TrustFeaturePill
              key={note}
              icon={CheckIcon}
              className="border-[hsl(var(--color-on-brand-cta-band)/0.2)] bg-transparent text-[hsl(var(--color-on-brand-cta-band)/0.65)] shadow-none"
            >
              {note}
            </TrustFeaturePill>
          ))}
        </>
      }
    />
  );
}
