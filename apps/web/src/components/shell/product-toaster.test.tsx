import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  PRODUCT_TOAST_CLASS_NAMES,
  PRODUCT_TOAST_DESKTOP_OFFSET,
  PRODUCT_TOAST_DURATION_MS,
  PRODUCT_TOAST_MOBILE_OFFSET,
} from "@/lib/ui/product-toast";

type CapturedToaster = {
  position?: string;
  className?: string;
  duration?: number;
  offset?: Record<string, string>;
  toastOptions?: { classNames?: typeof PRODUCT_TOAST_CLASS_NAMES };
  icons?: { success?: React.ReactNode; error?: React.ReactNode };
};

const capturedToasters: CapturedToaster[] = [];

vi.mock("sonner", () => ({
  Toaster: (props: CapturedToaster) => {
    capturedToasters.push(props);
    return null;
  },
}));

vi.mock("lucide-react", () => ({
  CircleCheck: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="circle-check" {...props} />
  ),
  CircleAlert: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="circle-alert" {...props} />
  ),
}));

import { ProductToaster } from "./product-toaster.client";

describe("ProductToaster", () => {
  it("uses top-center on mobile and bottom-right on lg with D-15 classNames", () => {
    capturedToasters.length = 0;
    renderToStaticMarkup(<ProductToaster />);

    expect(capturedToasters).toHaveLength(2);

    const mobile = capturedToasters[0]!;
    const desktop = capturedToasters[1]!;

    expect(mobile.position).toBe("top-center");
    expect(mobile.className).toContain("lg:hidden");
    expect(mobile.offset).toEqual(PRODUCT_TOAST_MOBILE_OFFSET);
    expect(mobile.duration).toBe(PRODUCT_TOAST_DURATION_MS);

    expect(desktop.position).toBe("bottom-right");
    expect(desktop.className).toContain("hidden lg:block");
    expect(desktop.offset).toEqual(PRODUCT_TOAST_DESKTOP_OFFSET);
    expect(desktop.duration).toBe(PRODUCT_TOAST_DURATION_MS);

    for (const cfg of capturedToasters) {
      expect(cfg.toastOptions?.classNames).toEqual(PRODUCT_TOAST_CLASS_NAMES);
      expect(cfg.toastOptions?.classNames?.toast).toContain("shadow-float");
      expect(cfg.toastOptions?.classNames?.success).toContain("bg-ok-soft");
      expect(cfg.toastOptions?.classNames?.error).toContain("bg-danger-soft");
      expect(cfg.toastOptions?.classNames?.default).toContain("bg-surface");
    }

    expect(mobile.icons?.success).toBeTruthy();
    expect(mobile.icons?.error).toBeTruthy();
  });
});
