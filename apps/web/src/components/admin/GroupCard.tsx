import { ChevronRight } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import { formatGroupListMeta } from "@/lib/admin/format-group-list-meta";
import type { GroupListRow } from "@/data/school/load-groups-admin-list.server";
import { formatGroupLanguageLabel } from "@/data/school/load-groups-admin-list.server";
import { formatPlural } from "@/lib/messages/plural";
import type { AdminMessages } from "@/lib/messages/admin-messages";
import type { MessageLocale } from "@/lib/messages/dictionary-types";

type GroupCardProps = {
  row: GroupListRow;
  messages: AdminMessages;
  uiLocale: MessageLocale;
};

export const GroupCard = ({ row, messages, uiLocale }: GroupCardProps) => {
  const languageLabel = formatGroupLanguageLabel(row.language);
  const teacherLabel = formatPlural(messages.group.teacherCountForms, row.teacherCount, uiLocale, {
    count: row.teacherCount,
  });
  const metaLine = formatGroupListMeta({
    languageLabel,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    teacherLabel,
    ageRangeTemplate: messages.group.ageRangeLabel,
  });

  return (
    <CustomLink
      href={`/groups/${row.gradeId}`}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:gap-6"
    >
      <span className="min-w-0 flex-1">
        <ContentText className="font-display text-xl font-medium text-ink">{row.name}</ContentText>
        <ContentText tone="secondary" className="mt-0.5 block text-sm">
          {metaLine}
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
