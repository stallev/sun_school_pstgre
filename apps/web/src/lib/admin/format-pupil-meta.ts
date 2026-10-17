import type { PupilListRow } from "@/data/school/load-people-admin-list.server";
import type { AdminMessages } from "@/lib/messages/admin-messages";

export const formatPupilMeta = (messages: AdminMessages, row: PupilListRow): string => {
  const born =
    row.birthDateIso
      ? messages.people.bornYear.replace("{year}", row.birthDateIso.slice(0, 4))
      : messages.people.birthUnknown;
  const group = row.groupName ?? messages.people.noGroup;
  return `${born} · ${group}`;
};
