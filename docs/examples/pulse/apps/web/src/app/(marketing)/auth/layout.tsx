import { PublicChrome } from "@/components/shell/PublicChrome";

export default function MarketingAuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PublicChrome>{children}</PublicChrome>;
}
