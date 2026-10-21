import { ChevronRight } from "lucide-react";
import { ContentText } from "@/components/atoms/ContentText";
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

  return (
    <CustomLink
      href={`/groups/${row.gradeId}`}
      className="grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_6rem_1.5rem] sm:items-center sm:gap-6"
    >
      <span className="min-w-0">
        <ContentText className="block font-display text-xl font-medium text-ink">{row.name}</ContentText>
        {ageLabel ? (
          <ContentText tone="secondary" className="block text-sm">{ageLabel}</ContentText>
        ) : null}
      </span>
      <ContentText tone="secondary" className="text-sm text-ink-2">
        {formatGroupLanguageLabel(row.language)}
        {!row.isActive ? ` · ${messages.group.statusInactive}` : null}
      </ContentText>
      <ContentText tone="secondary" className="tabular-nums text-sm text-ink-2 sm:text-end">
        {teacherLabel}
      </ContentText>
      <ChevronRight className="hidden size-5 shrink-0 text-muted sm:block" aria-hidden />
    </CustomLink>
  );
};
