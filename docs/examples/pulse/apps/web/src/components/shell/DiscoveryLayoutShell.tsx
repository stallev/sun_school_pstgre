import { Suspense } from "react";

import { AppShellCanvas } from "@/components/shell/AppShellCanvas";
import { DiscoveryBottomNavGate } from "@/components/shell/DiscoveryBottomNavGate.server";
import { DiscoverySidebarGate } from "@/components/shell/DiscoverySidebarGate.server";
import { DiscoveryTrainerBannerGate } from "@/components/shell/DiscoveryTrainerBannerGate.server";
import { PageContainer } from "@/components/shell/PageContainer";
import { SkipToMainLink } from "@/components/shell/SkipToMainLink";
import { TopBar } from "@/components/shell/TopBar";
import { TopBarFallback } from "@/components/shell/TopBarFallback";

type DiscoveryLayoutShellProps = {
  children: React.ReactNode;
};

/**
 * Discovery routes: page content streams without waiting for role nav/auth.
 * TopBar + role chrome resolve in parallel Suspense boundaries.
 */
export function DiscoveryLayoutShell({ children }: DiscoveryLayoutShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipToMainLink />
      <Suspense fallback={<TopBarFallback />}>
        <TopBar />
      </Suspense>
      <div className="flex min-h-0 flex-1 flex-col items-center">
        <AppShellCanvas>
          <Suspense fallback={null}>
            <DiscoverySidebarGate />
          </Suspense>
          <PageContainer inShellCanvas withBottomNav>
            <Suspense fallback={null}>
              <DiscoveryTrainerBannerGate />
            </Suspense>
            {children}
          </PageContainer>
        </AppShellCanvas>
      </div>
      <Suspense fallback={null}>
        <DiscoveryBottomNavGate />
      </Suspense>
    </div>
  );
}
