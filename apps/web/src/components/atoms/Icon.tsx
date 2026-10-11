import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type IconProps = Omit<LucideProps, "ref"> & {
  icon: LucideIcon;
  /** Accessible name; omit for decorative icons (rendered `aria-hidden`). */
  label?: string;
};

/** Project icon wrapper: `size-4` default, stroke 1.75, decorative unless `label` is given. */
export const Icon = ({ icon: Glyph, label, className, ...props }: IconProps) => (
  <Glyph
    strokeWidth={1.75}
    className={cn("size-4", className)}
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? "img" : undefined}
    {...props}
  />
);
