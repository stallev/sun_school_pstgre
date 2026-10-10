import {
  AdminPillTabsList,
  type AdminPillTabsListItem,
} from "@/components/admin/AdminPillTabsList";
import { getComplaintCounts } from "@/data/admin/list-complaints.server";

export type AdminComplaintsCountsProps = {
  tabs: AdminPillTabsListItem[];
  ariaLabel: string;
};

export async function AdminComplaintsCounts({
  tabs,
  ariaLabel,
}: AdminComplaintsCountsProps) {
  const counts = await getComplaintCounts();

  return (
    <AdminPillTabsList tabs={tabs} counts={counts} ariaLabel={ariaLabel} />
  );
}
