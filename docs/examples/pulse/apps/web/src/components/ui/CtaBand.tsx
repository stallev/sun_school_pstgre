import { SectionEyebrow } from "@/components/atoms";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export type CtaBandProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions: React.ReactNode;
  footnotes?: React.ReactNode;
  className?: string;
};

export function CtaBand({
  eyebrow,
  title,
  description,
  actions,
  footnotes,
  className,
}: CtaBandProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-brand-cta-band px-6 py-[104px] text-center md:px-14",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[280px] -right-[200px] size-[700px] rounded-full bg-[hsl(var(--color-on-brand-cta-band)/0.05)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[140px] -left-[100px] size-[350px] rounded-full bg-[hsl(var(--color-on-brand-cta-band)/0.05)]"
      />
      <Container variant="marketing" className="relative z-10 max-w-[680px]">
        {eyebrow ? (
          <SectionEyebrow tone="onPrimary" className="mb-5">
            {eyebrow}
          </SectionEyebrow>
        ) : null}
        <h2 className="mb-5 font-heading text-[clamp(2.75rem,5.5vw,4.375rem)] leading-[0.97] tracking-[-0.045em] text-on-brand-cta-band">
          {title}
        </h2>
        {description ? (
          <p className="mb-12 text-lg leading-relaxed text-[hsl(var(--color-on-brand-cta-band)/0.72)]">
            {description}
          </p>
        ) : null}
        <div className="mb-7 flex flex-wrap items-center justify-center gap-4">
          {actions}
        </div>
        {footnotes ? (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footnotes}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
