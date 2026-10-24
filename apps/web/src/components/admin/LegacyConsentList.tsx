import { SectionTitle } from "@/components/atoms/SectionTitle";
import { ContentText } from "@/components/atoms/ContentText";
import { ExtendLegacyDeadlineDialog } from "@/components/admin/ExtendLegacyDeadlineDialog.client";
import { LegacyConsentBadge } from "@/components/admin/LegacyConsentBadge";
import type { LegacyPendingRow } from "@/data/school/list-legacy-pending";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type LegacyConsentListProps = {
  deadlineOn: string | null;
  rows: readonly LegacyPendingRow[];
  defaultNewDeadlineOn: string;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
  closeLabel: string;
  messages: AdminMessages;
};

export const LegacyConsentList = ({
  deadlineOn,
  rows,
  defaultNewDeadlineOn,
  dictionaries,
  uiLocale,
  formError,
  closeLabel,
  messages,
}: LegacyConsentListProps) => {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4" aria-labelledby="legacy-consent-list">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <SectionTitle id="legacy-consent-list">{messages.people.legacyListTitle}</SectionTitle>
          <ContentText tone="secondary" className="text-sm">
            {messages.people.legacyListDescription}
          </ContentText>
          {deadlineOn ? (
            <ContentText className="text-sm">
              {messages.people.legacyDeadlineLabel.replace("{date}", deadlineOn)}
            </ContentText>
          ) : null}
        </div>
        {deadlineOn ? (
          <ExtendLegacyDeadlineDialog
            defaultNewDeadlineOn={defaultNewDeadlineOn}
            dictionaries={dictionaries}
            uiLocale={uiLocale}
            formError={formError}
            closeLabel={closeLabel}
          />
        ) : null}
      </div>
      <ul className="divide-y divide-line rounded-lg border border-line bg-card">
        {rows.map((row) => (
          <li key={row.pupilId} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <ContentText className="font-medium text-ink">{row.displayName}</ContentText>
            <LegacyConsentBadge
              isOverdue={row.isOverdue}
              daysRemaining={row.daysRemaining}
              legacyLabel={messages.people.consentLegacy}
              overdueLabel={messages.people.legacyDaysOverdue}
              daysRemainingLabel={messages.people.legacyDaysRemaining}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};
