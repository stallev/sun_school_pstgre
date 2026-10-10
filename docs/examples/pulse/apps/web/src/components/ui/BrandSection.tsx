import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type BrandSectionTag = "section" | "div";

export type BrandSectionProps = {
  as?: BrandSectionTag;
  tone?: "darkForest" | "primary";
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
};

const TONE_CLASSES = {
  darkForest: "bg-brand-band text-on-brand-band",
  primary: "bg-primary text-primary-foreground",
} as const;

export function BrandSection({
  as: As = "section",
  tone = "darkForest",
  id,
  className,
  innerClassName,
  children,
}: BrandSectionProps) {
  return (
    <As id={id} className={cn("py-24", TONE_CLASSES[tone], className)}>
      <Container variant="marketing" className={innerClassName}>
        {children}
      </Container>
    </As>
  );
}
