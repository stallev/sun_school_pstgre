import { ChevronRight } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { formatGroupAgeRange } from "@/lib/admin/format-group-age-range";
import type { GroupListRow } from "@/data/school/load-groups-admin-list.server";
import { formatGroupLanguageLabel } from "@/data/school/load-groups-admin-list.server";
import { fillMessage } from "@/lib/messages/fill-message";
import { formatPlural } from "@/lib/messages/plural";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { HintTerm } from "@/lib/messages/pick-hints-messages";

type GroupCardProps = {
  row: GroupListRow;
  messages: AdminMessages;
  uiLocale: MessageLocale;
  groupLanguageHint: HintTerm;
};

export const GroupCard = ({ row, messages, uiLocale, groupLanguageHint }: GroupCardProps) => {
  const languageLabel = formatGroupLanguageLabel(row.language, {
    ru: messages.group.languageRu,
    en: messages.group.languageEn,
  });
  const teacherLabel = formatPlural(messages.group.teacherCountForms, row.teacherCount, uiLocale, {
    count: row.teacherCount,
  });
  const range = formatGroupAgeRange(row.ageMin, row.ageMax);
  const ageLabel = range ? fillMessage(messages.group.ageRangeLabel, { range }) : null;

  return (
    <CustomLink
      href={`/groups/${row.gradeId}`}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:gap-6"
    >
      <span className="min-w-0 flex-1">
        <ContentText className="font-display text-xl font-medium text-ink">{row.name}</ContentText>
        <ContentText tone="secondary" className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
          <TermLabel
            term={nonEmptyTerm(languageLabel)}
            hint={groupLanguageHint.hint}
            ariaLabel={groupLanguageHint.term}
          />
          {ageLabel ? <span>· {ageLabel}</span> : null}
          {teacherLabel ? <span>· {teacherLabel}</span> : null}
        </ContentText>
        {!row.isActive ? (
          <ContentText tone="secondary" className="mt-0.5 block text-sm">
            {messages.group.statusInactive}
          </ContentText>
        ) : null}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </CustomLink>
  );
};
