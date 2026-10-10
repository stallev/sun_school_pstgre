import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { AdminPillTabsListItem } from "@/components/admin/AdminPillTabsList";

export type AdminPillTabsListSkeletonProps = {
  tabs: AdminPillTabsListItem[];
  ariaLabel: string;
};

export function AdminPillTabsListSkeleton({
  tabs,
  ariaLabel,
}: AdminPillTabsListSkeletonProps) {
  return (
    <TabsList
      variant="pill"
      aria-label={ariaLabel}
      aria-busy="true"
      className={cn(
        "max-w-full",
        "w-fit",
        "-mx-4 overflow-x-auto px-4 no-scrollbar",
        "md:mx-0 md:px-0 md:overflow-visible",
      )}
    >
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
