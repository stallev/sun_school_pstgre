import { ContentText } from "@/components/atoms";

export function DesignLabMarketingPatternBlock({
  patternId,
  title,
  children,
}: {
  patternId: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-[var(--card-radius-lg)] border border-border bg-card p-4">
      <div>
        <ContentText variant="smallEmphasis" as="p">
          {title}
        </ContentText>
        <ContentText variant="mutedMicro" as="p">
          Prototype: <span className="font-mono">{patternId}</span>
        </ContentText>
      </div>
      {children}
    </div>
  );
}
