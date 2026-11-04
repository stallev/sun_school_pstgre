import { ContentText } from "@/components/atoms/ContentText";

type AuditChangeListProps = {
  lines: string[];
  reason: string | null;
  reasonPrefix: string;
};

export const AuditChangeList = ({ lines, reason, reasonPrefix }: AuditChangeListProps) => (
  <div className="min-w-0 space-y-1">
    {lines.length > 0 ? (
      <ul className="list-inside list-disc text-sm text-ink-2">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    ) : (
      <ContentText tone="secondary" className="text-sm">
        —
      </ContentText>
    )}
    {reason ? (
      <ContentText tone="secondary" className="text-sm">
        {reasonPrefix}: {reason}
      </ContentText>
    ) : null}
  </div>
);
