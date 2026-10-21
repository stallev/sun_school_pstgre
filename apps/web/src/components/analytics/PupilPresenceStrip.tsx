import { Check, X } from "lucide-react";
import type { PupilPresenceSegment } from "@/data/analytics/pupil-analytics-present.server";
import { formatAnalyticsShortDate } from "@/lib/analytics/format-analytics-display";
import type { PupilAnalyticsMessages } from "@/lib/messages/analytics-messages";
import { cn } from "@/lib/utils";

type PupilPresenceStripProps = {
  segments: PupilPresenceSegment[];
  messages: PupilAnalyticsMessages;
  locale: string;
};

const stateLabel = (
  state: PupilPresenceSegment["state"],
  messages: PupilAnalyticsMessages,
): string => {
  switch (state) {
    case "present":
      return messages.presencePresent;
    case "absent":
      return messages.presenceAbsent;
    default:
      return messages.presenceMissing;
  }
};

export const PupilPresenceStrip = ({
  segments,
  messages,
  locale,
}: PupilPresenceStripProps) => (
  <ol className="flex flex-wrap gap-1.5" aria-label={messages.presenceTitle}>
    {segments.map((segment) => {
      const label = stateLabel(segment.state, messages);
      const dateLabel = formatAnalyticsShortDate(segment.lessonDate, locale);
      return (
        <li
          key={segment.lessonId}
          title={`${dateLabel} — ${label}`}
          className={cn(
            "flex w-14 flex-col items-center gap-1 rounded-lg border px-1 py-2",
            segment.state === "present" && "border-ink bg-ink text-surface",
            segment.state === "absent" && "border-line-strong bg-surface text-ink-2",
            segment.state === "missing" && "border-line bg-paper text-muted",
          )}
        >
          <span className="text-xs tabular-nums">{dateLabel}</span>
          <span className="text-sm">
            {segment.state === "present" ? (
              <>
                <Check className="size-4" aria-hidden />
                <span className="sr-only">{messages.presencePresent}</span>
              </>
            ) : segment.state === "absent" ? (
              <>
                <X className="size-4" aria-hidden />
                <span className="sr-only">{messages.presenceAbsent}</span>
              </>
            ) : (
              <>
                <span aria-hidden>—</span>
                <span className="sr-only">{messages.presenceMissing}</span>
              </>
            )}
          </span>
        </li>
      );
    })}
  </ol>
);
