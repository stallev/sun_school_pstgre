import { SkipToMainLink } from "@/components/shell/SkipToMainLink";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background scroll-smooth">
      <SkipToMainLink />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
