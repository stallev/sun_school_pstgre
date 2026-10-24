import { ChevronRight } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
import { Badge } from "@/components/ui/badge";
import { CustomLink } from "@/components/ui/custom-link";
import type { GroupListRow } from "@/data/school/load-groups-admin-list.server";
import { formatGroupLanguageLabel } from "@/data/school/load-groups-admin-list.server";
import { formatGroupAgeRange } from "@/lib/admin/format-group-age-range";
import { formatTeacherCount, type AdminMessages } from "@/lib/messages/admin-messages";

type GroupCardProps = {
  row: GroupListRow;
  messages: AdminMessages;
};

export const GroupCard = ({ row, messages }: GroupCardProps) => {
  const ageLabel = formatGroupAgeRange(row.ageMin, row.ageMax);
  const teacherLabel = formatTeacherCount(messages.group.teacherCount, row.teacherCount);
  const languageLabel = formatGroupLanguageLabel(row.language);

  return (
    <CustomLink
      href={`/groups/${row.gradeId}`}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:gap-6"
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <ContentText className="font-display text-xl font-medium text-ink">{row.name}</ContentText>
          <Badge variant="outline">{languageLabel}</Badge>
          {!row.isActive ? (
            <ContentText tone="secondary" className="text-sm">
              {messages.group.statusInactive}
            </ContentText>
          ) : null}
        </span>
        {ageLabel ? (
          <ContentText tone="secondary" className="mt-0.5 block text-sm">
            {ageLabel}
          </ContentText>
        ) : null}
      </span>
      <ContentText tone="secondary" className="tabular-nums text-sm text-ink-2 text-end">
        {teacherLabel}
      </ContentText>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </CustomLink>
  );
};
