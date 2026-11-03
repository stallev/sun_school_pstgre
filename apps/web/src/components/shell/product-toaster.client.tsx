"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { Toaster } from "sonner";
import {
  PRODUCT_TOAST_CLASS_NAMES,
  PRODUCT_TOAST_DESKTOP_OFFSET,
  PRODUCT_TOAST_DURATION_MS,
  PRODUCT_TOAST_MOBILE_OFFSET,
} from "@/lib/ui/product-toast";

const productToastOptions = {
  classNames: PRODUCT_TOAST_CLASS_NAMES,
};

const productToastIcons = {
  success: <CircleCheck className="size-5 shrink-0 text-ok" aria-hidden />,
  error: <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />,
};

/** Toast positions and tokens per UX-03 D-15 / global_shell_spec §6.5. */
export const ProductToaster = () => (
  <>
    <Toaster
      position="top-center"
      duration={PRODUCT_TOAST_DURATION_MS}
      className="lg:hidden"
      offset={PRODUCT_TOAST_MOBILE_OFFSET}
      toastOptions={productToastOptions}
      icons={productToastIcons}
    />
    <Toaster
      position="bottom-right"
      duration={PRODUCT_TOAST_DURATION_MS}
      className="hidden lg:block"
      offset={PRODUCT_TOAST_DESKTOP_OFFSET}
      toastOptions={productToastOptions}
      icons={productToastIcons}
    />
  </>
);
