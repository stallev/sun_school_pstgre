import { Suspense } from "react";

import { PageContainer } from "@/components/shell/PageContainer";
import { SkipToMainLink } from "@/components/shell/SkipToMainLink";
import { TopBar } from "@/components/shell/TopBar";
import { TopBarFallback } from "@/components/shell/TopBarFallback";

type PublicChromeProps = {
  children: React.ReactNode;
};

export function PublicChrome({ children }: PublicChromeProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipToMainLink />
      <Suspense fallback={<TopBarFallback />}>
        <TopBar />
      </Suspense>
      <PageContainer withBottomNav={false} className="flex flex-1 flex-col">
        {children}
      </PageContainer>
    </div>
  );
}
