"use client";

import { useRouter } from "next/navigation";

import { Tabs, TabsContent } from "@/components/ui/tabs";

export type AdminPillTabsProps = {
  activeTab: string;
  basePath: string;
  defaultTab: string;
  tabsList: React.ReactNode;
  children: React.ReactNode;
};

export function AdminPillTabs({
  activeTab,
  basePath,
  defaultTab,
  tabsList,
  children,
}: AdminPillTabsProps) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    const nextUrl =
      value === defaultTab ? basePath : `${basePath}?tab=${value}`;
    router.replace(nextUrl);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
      {tabsList}
      <TabsContent value={activeTab}>{children}</TabsContent>
    </Tabs>
  );
}
