import { ContentText } from "@/components/atoms";
import { PulseCard, type PulseCardProps } from "@/components/ui/card";

type PulseCardLabFixtureProps = Pick<
  PulseCardProps,
  "variant" | "state" | "interactive"
>;

export function PulseCardLabFixture({
  variant = "base",
  state = "default",
  interactive = false,
}: PulseCardLabFixtureProps) {
  const cardProps = {
    variant,
    state,
    interactive,
    tabIndex: interactive ? 0 : undefined,
    className: interactive ? "min-h-11" : undefined,
  } satisfies Partial<PulseCardProps>;

  if (variant === "elevated") {
    return (
      <PulseCard {...cardProps}>
        <div className="bg-[color:var(--forest-mid)] px-[var(--card-p-lg)] py-3">
          <ContentText
            variant="caption"
            as="p"
            className="text-primary-foreground/90"
          >
            Today&apos;s session
          </ContentText>
        </div>
        <div className="px-[var(--card-p-lg)] py-[var(--card-p-md)]">
          <ContentText variant="smallEmphasis" as="p">
            Morning HIIT with Anna
          </ContentText>
          <ContentText variant="muted" as="p" className="mt-1">
            Tomorrow · 08:00 · 60 min
          </ContentText>
        </div>
      </PulseCard>
    );
  }

  if (variant === "compact") {
    return (
      <PulseCard {...cardProps}>
        <ContentText variant="smallEmphasis" as="p">
          Anna Romanova
        </ContentText>
        <ContentText variant="muted" as="p" className="mt-0.5">
          Morning HIIT · 60 min
        </ContentText>
        <ContentText variant="smallEmphasisPrimary" as="p" className="mt-1.5">
          Tomorrow, 08:00
        </ContentText>
      </PulseCard>
    );
  }

  if (variant === "row") {
    return (
      <PulseCard {...cardProps}>
        <ContentText variant="caption" as="p" className="w-20 shrink-0">
          Status
        </ContentText>
        <ContentText variant="small" as="p" className="min-w-0 flex-1 break-words">
          Card body placeholder — wraps instead of clipping on narrow viewports.
        </ContentText>
      </PulseCard>
    );
  }

  return (
    <PulseCard {...cardProps}>
      <ContentText variant="caption" as="p">
        Session summary
      </ContentText>
      <ContentText variant="small" as="p" className="mt-2">
        Card body placeholder for dashboard blocks and detail panels.
      </ContentText>
    </PulseCard>
  );
}
