import { SkipToMainLink } from "@/components/shell/SkipToMainLink";
import { PageContainer } from "@/components/shell/PageContainer";

export default function BookingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-background">
      <SkipToMainLink />
      <PageContainer variant="narrow" withBottomNav={false}>
        {children}
      </PageContainer>
    </div>
  );
}
