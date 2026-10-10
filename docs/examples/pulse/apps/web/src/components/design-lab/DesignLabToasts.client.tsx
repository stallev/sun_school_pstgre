"use client";

import { toast } from "sonner";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

// design-lab-only copy — product routes use @/lib/messages
const LAB_TOAST_COPY = {
  success: "Booking confirmed",
  error: "Could not save changes. Try again.",
  info: "Your session starts in 1 hour",
  warning: "Complete payment within 15 minutes",
  loading: "Saving booking…",
} as const;

export function DesignLabToasts() {
  return (
    <DesignLabSection id="toasts" title="L2 — Toast notifications (Sonner)">
      <div className="space-y-6">
        <ContentText variant="muted" as="p">
          Global <code className="font-mono text-xs">Toaster</code> in root layout.
          Duration:{" "}
          <span className="font-mono">{PRODUCT_TOAST_DURATION_MS}ms</span>.
          Position: top-center (does not cover Bottom Nav).
        </ContentText>

        <div>
          <VariantLabel>Mutation feedback matrix</VariantLabel>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() =>
                toast.success(LAB_TOAST_COPY.success, {
                  duration: PRODUCT_TOAST_DURATION_MS,
                })
              }
            >
              Success
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                toast.error(LAB_TOAST_COPY.error, {
                  duration: PRODUCT_TOAST_DURATION_MS,
                })
              }
            >
              Error
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info(LAB_TOAST_COPY.info, {
                  duration: PRODUCT_TOAST_DURATION_MS,
                })
              }
            >
              Info
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                toast.warning(LAB_TOAST_COPY.warning, {
                  duration: PRODUCT_TOAST_DURATION_MS,
                })
              }
            >
              Warning
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const id = toast.loading(LAB_TOAST_COPY.loading);
                window.setTimeout(() => {
                  toast.dismiss(id);
                  toast.success(LAB_TOAST_COPY.success, {
                    duration: PRODUCT_TOAST_DURATION_MS,
                  });
                }, 1200);
              }}
            >
              Loading → success
            </Button>
          </div>
        </div>

        <ContentText variant="hint" as="p">
          Prototype anchor: post-mutation flows — booking created, profile saved,
          admin approve/reject. Error toast is mandatory on optimistic rollback.
        </ContentText>
      </div>
    </DesignLabSection>
  );
}
