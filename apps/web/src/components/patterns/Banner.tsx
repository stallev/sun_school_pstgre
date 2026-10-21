import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/utils";

const bannerVariants = cva("flex gap-3 rounded-xl border p-3 sm:p-4", {
  variants: {
    tone: {
      error: "border-danger/40 bg-danger-soft",
      warning: "border-warn/40 bg-warn-soft",
      success: "border-ok/40 bg-ok-soft",
      info: "border-cobalt/30 bg-cobalt-soft",
    },
  },
  defaultVariants: { tone: "info" },
});

const ICONS = {
  error: { glyph: CircleAlert, className: "text-danger" },
  warning: { glyph: TriangleAlert, className: "text-warn" },
  success: { glyph: CircleCheck, className: "text-ok" },
  info: { glyph: Info, className: "text-cobalt-ink" },
} as const;

type BannerProps = VariantProps<typeof bannerVariants> & {
  title?: string;
  children?: ReactNode;
  className?: string;
};

/** Error banner follows UX-03 D-8: danger icon, bold title, `ink` text on `danger-soft`. */
export const Banner = ({ tone, title, children, className }: BannerProps) => {
  const key = tone ?? "info";
  const icon = ICONS[key];
  return (
    <div
      role={key === "error" ? "alert" : "status"}
      className={cn(bannerVariants({ tone: key }), className)}
    >
      <Icon icon={icon.glyph} className={cn("mt-0.5 size-5 shrink-0", icon.className)} />
      <div className="min-w-0 space-y-1 text-ink">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={title ? "text-base" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
};
