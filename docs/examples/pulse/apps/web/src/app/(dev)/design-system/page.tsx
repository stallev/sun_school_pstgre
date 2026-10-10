import { Heading } from "@/components/atoms";
import { DesignLabShell } from "@/components/design-lab/DesignLabControls.client";
import { DesignLabSettings } from "@/components/design-lab/DesignLabSettings.client";
import { DesignLabButtons } from "@/components/design-lab/DesignLabButtons";
import { DesignLabCards } from "@/components/design-lab/DesignLabCards";
import { DesignLabCatalogPatterns } from "@/components/design-lab/DesignLabCatalogPatterns.client";
import { DesignLabMarketing } from "@/components/design-lab/DesignLabMarketing.client";
import { DesignLabForms } from "@/components/design-lab/DesignLabForms.client";
import { DesignLabLinks } from "@/components/design-lab/DesignLabLinks";
import { DesignLabModals } from "@/components/design-lab/DesignLabModals.client";
import { DesignLabMedia } from "@/components/design-lab/DesignLabMedia.client";
import { DesignLabPatterns } from "@/components/design-lab/DesignLabPatterns";
import { DesignLabTokenSwatches } from "@/components/design-lab/DesignLabTokenSwatches";
import { DesignLabToasts } from "@/components/design-lab/DesignLabToasts.client";
import { DesignLabTypography } from "@/components/design-lab/DesignLabTypography";
import { Container } from "@/components/ui/container";

export default function DesignSystemPage() {
  return (
    <DesignLabShell>
      <Container as="main" variant="page" className="pb-16">
        <header className="border-b border-border py-10">
          <Heading as="h1">Design System Lab</Heading>
        </header>
        <DesignLabTokenSwatches />
        <DesignLabSettings />
        <DesignLabTypography />
        <DesignLabButtons />
        <DesignLabLinks />
        <DesignLabCards />
        <DesignLabForms />
        <DesignLabToasts />
        <DesignLabModals />
        <DesignLabMedia />
        <DesignLabPatterns />
        <DesignLabCatalogPatterns />
        <DesignLabMarketing />
      </Container>
    </DesignLabShell>
  );
}
