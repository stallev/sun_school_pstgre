import type { UserRole } from "@pulse/domain";

import { AppShellCanvas } from "@/components/shell/AppShellCanvas";
import { SkipToMainLink } from "@/components/shell/SkipToMainLink";
import { BottomNav } from "@/components/shell/BottomNav.client";
import { PageContainer } from "@/components/shell/PageContainer";
import { SidebarNav } from "@/components/shell/SidebarNav.client";
import { TopBar } from "@/components/shell/TopBar";
import type { AdminNavBadges, NavItemConfig } from "@/lib/nav/nav-config";

type AppShellProps = {
  role: UserRole;
  navItems: NavItemConfig[];
  sectionTitle: string;
  badges?: AdminNavBadges;
  banner?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  role,
  navItems,
  sectionTitle,
  badges,
  banner,
  children,
}: AppShellProps) {

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipToMainLink />
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col items-center">
        <AppShellCanvas>
          <SidebarNav
            items={navItems}
            sectionTitle={sectionTitle}
            badges={badges}
          />
          <PageContainer inShellCanvas>
            {banner ? <div className="mb-4">{banner}</div> : null}
            {children}
          </PageContainer>
        </AppShellCanvas>
      </div>
      <BottomNav items={navItems} badges={badges} />
    </div>
  );
}
