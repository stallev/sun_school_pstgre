import { PageContainer } from "@/components/shell/PageContainer";
import { SessionHeader } from "@/components/shell/SessionHeader";

export default function SessionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SessionHeader />
      <PageContainer variant="narrow" withBottomNav={false}>
        {children}
      </PageContainer>
    </div>
  );
}
