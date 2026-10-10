import { ContentText, Heading } from "@/components/atoms";
import { cn } from "@/lib/utils";

import { getPrototypeRef } from "@/lib/design-lab/prototype-refs";

type DesignLabSectionProps = {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function DesignLabSection({
  id,
  title,
  children,
  className,
}: DesignLabSectionProps) {
  const prototype = getPrototypeRef(id);

  return (
    <section id={id} className={cn("scroll-mt-24 space-y-6 py-10", className)}>
      <div className="space-y-1">
        <Heading as="h2" visualLevel="h3">
          {title}
        </Heading>
        {prototype ? (
          <ContentText variant="mutedMicro" as="p">
            Prototype:{" "}
            <span className="font-mono text-foreground">{prototype.screenId}</span>
            {prototype.note ? ` — ${prototype.note}` : null}
          </ContentText>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function VariantLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-xs text-subtle-foreground">{children}</p>
  );
}
