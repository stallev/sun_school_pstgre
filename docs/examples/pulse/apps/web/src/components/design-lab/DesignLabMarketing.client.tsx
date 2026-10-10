"use client";

import { DesignLabMarketingPatterns } from "@/components/design-lab/DesignLabMarketingPatterns.client";
import { DesignLabMarketingWaveA } from "@/components/design-lab/DesignLabMarketingWaveA.client";
import { DesignLabSection } from "@/components/design-lab/DesignLabSection";

export function DesignLabMarketing() {
  return (
    <DesignLabSection id="marketing" title="L3 — Marketing / Landing (P16)">
      <div className="space-y-8">
        <DesignLabMarketingWaveA />
        <DesignLabMarketingPatterns />
      </div>
    </DesignLabSection>
  );
}
