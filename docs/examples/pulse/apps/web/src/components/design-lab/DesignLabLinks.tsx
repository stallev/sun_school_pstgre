import { UserIcon } from "lucide-react";

import { CustomLink } from "@/components/ui/CustomLink";

import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import { LINK_DEMOS } from "@/lib/design-lab/matrices";

export function DesignLabLinks() {
  return (
    <DesignLabSection id="links" title="L2 — CustomLink">
      <div className="flex flex-wrap gap-6">
        {LINK_DEMOS.map((demo) => (
          <div key={demo.label}>
            <VariantLabel>{demo.label}</VariantLabel>
            <CustomLink
              href="#links"
              as={demo.as}
              variant={demo.variant}
              aria-label={demo.as === "icon" ? "Open profile" : undefined}
            >
              {demo.as === "icon" ? (
                <UserIcon aria-hidden />
              ) : demo.as === "button" ? (
                "Browse trainers"
              ) : (
                "Terms of service"
              )}
            </CustomLink>
          </div>
        ))}
      </div>
    </DesignLabSection>
  );
}
