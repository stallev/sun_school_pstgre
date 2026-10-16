"use client";

import { Toaster } from "sonner";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

/** Toast positions per UX-02 / global_shell_spec §6.5. */
export const ProductToaster = () => (
  <>
    <Toaster
      position="top-center"
      duration={PRODUCT_TOAST_DURATION_MS}
      className="lg:hidden"
      toastOptions={{ className: "mt-16" }}
    />
    <Toaster
      position="bottom-center"
      duration={PRODUCT_TOAST_DURATION_MS}
      className="hidden lg:block"
      toastOptions={{ className: "mb-6" }}
    />
  </>
);
