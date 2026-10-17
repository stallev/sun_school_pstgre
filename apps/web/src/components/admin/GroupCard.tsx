import { ContentText } from "@/components/atoms/ContentText";
import { CustomLink } from "@/components/ui/custom-link";
import type { GroupListRow } from "@/data/school/load-groups-admin-list.server";
import { formatGroupLanguageLabel } from "@/data/school/load-groups-admin-list.server";
import { formatTeacherCount, type AdminMessages } from "@/lib/messages/admin-messages";

type GroupCardProps = {
  row: GroupListRow;
  messages: AdminMessages;
};

export const GroupCard = ({ row, messages }: GroupCardProps) => (
  <CustomLink
    href={`/groups/${row.gradeId}`}
    className="flex min-h-11 flex-col gap-1 px-4 py-3 transition-colors hover:bg-paper md:flex-row md:items-center md:justify-between"
  >
    <ContentText className="font-medium text-ink">{row.name}</ContentText>
    <ContentText tone="secondary" className="text-sm">
      {formatGroupLanguageLabel(row.language)} ·{" "}
      {row.isActive ? messages.group.statusActive : messages.group.statusInactive} ·{" "}
      {formatTeacherCount(messages.group.teacherCount, row.teacherCount)}
    </ContentText>
  </CustomLink>
);
