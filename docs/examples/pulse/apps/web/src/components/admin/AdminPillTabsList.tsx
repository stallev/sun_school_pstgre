import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatModerationTabLabel } from "@/lib/admin/format-tab-label";
import { cn } from "@/lib/utils";

export type AdminPillTabsListItem = {
  value: string;
  label: string;
};

export type AdminPillTabsListProps = {
  tabs: AdminPillTabsListItem[];
  counts: Record<string, number>;
  ariaLabel: string;
};

export function AdminPillTabsList({
  tabs,
  counts,
  ariaLabel,
}: AdminPillTabsListProps) {
  return (
    <TabsList
      variant="pill"
      aria-label={ariaLabel}
      className={cn(
        "max-w-full",
        "w-fit",
        "-mx-4 overflow-x-auto px-4 no-scrollbar",
        "md:mx-0 md:px-0 md:overflow-visible",
      )}
    >
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value}>
          {formatModerationTabLabel(tab.label, counts[tab.value] ?? 0)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
