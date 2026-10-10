import {
  AdminPillTabsList,
  type AdminPillTabsListItem,
} from "@/components/admin/AdminPillTabsList";
import { getTrainerApplicationCounts } from "@/data/admin/list-trainer-applications.server";

export type AdminTrainersCountsProps = {
  tabs: AdminPillTabsListItem[];
  ariaLabel: string;
};

export async function AdminTrainersCounts({
  tabs,
  ariaLabel,
}: AdminTrainersCountsProps) {
  const counts = await getTrainerApplicationCounts();

  return (
    <AdminPillTabsList tabs={tabs} counts={counts} ariaLabel={ariaLabel} />
  );
}
