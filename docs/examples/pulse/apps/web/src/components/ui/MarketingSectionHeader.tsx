"use client";

import { ContentText, SectionEyebrow, SectionTitle } from "@/components/atoms";
import { Reveal } from "@/components/ui/Reveal.client";
import { cn } from "@/lib/utils";

export type MarketingSectionHeaderProps = {
  label: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: "default" | "onDark";
  align?: "center" | "left";
  animate?: boolean;
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
};

export function MarketingSectionHeader({
  label,
  title,
  subtitle,
  tone = "default",
  align = "center",
  animate = false,
  className,
  titleAs = "h2",
}: MarketingSectionHeaderProps) {
  const eyebrowTone = tone === "onDark" ? "onDark" : "default";
  const titleVariant = tone === "onDark" ? "dark" : "default";
  const subtitleVariant = tone === "onDark" ? "lead" : "lead";

  const wrapper = (node: React.ReactNode, delay?: string) =>
    animate ? (
      <Reveal delay={delay}>{node}</Reveal>
    ) : (
      node
    );

  return (
    <div
      className={cn(
        "mb-16 max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {wrapper(
        <SectionEyebrow tone={eyebrowTone} className="mb-5">
          {label}
        </SectionEyebrow>,
      )}
      {wrapper(
        <SectionTitle
          as={titleAs}
          variant={titleVariant}
          className={cn(
            "mb-3.5 text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.05] tracking-tight",
            align === "left" && "mx-0 text-left",
          )}
        >
          {title}
        </SectionTitle>,
        "100ms",
      )}
      {subtitle
        ? wrapper(
            <ContentText
              variant={subtitleVariant}
              as="p"
              className={cn(
                "max-w-[540px] leading-relaxed",
                align === "center" && "mx-auto",
                tone === "onDark" && "text-brand-band-muted",
              )}
            >
              {subtitle}
            </ContentText>,
            "200ms",
          )
        : null}
    </div>
  );
}
