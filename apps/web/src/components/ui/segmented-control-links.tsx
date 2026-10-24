import { CustomLink } from "@/components/ui/custom-link";
import { segmentedChipClassName } from "@/lib/ui/segmented-chip-classes";
import { cn } from "@/lib/utils";

export type SegmentedLinkOption = {
  value: string;
  label: string;
  href: string;
};

type SegmentedControlLinksProps = {
  options: readonly SegmentedLinkOption[];
  value: string;
  "aria-label": string;
  size?: "default" | "compact";
  className?: string;
};

/** URL navigation chips with the same visuals as `SegmentedControl`. */
export const SegmentedControlLinks = ({
  options,
  value,
  size = "default",
  className,
  ...aria
}: SegmentedControlLinksProps) => (
  <div
    role="radiogroup"
    aria-label={aria["aria-label"]}
    className={cn("flex flex-wrap gap-2", className)}
  >
    {options.map((option) => {
      const checked = option.value === value;
      return (
        <CustomLink
          key={option.value}
          href={option.href}
          role="radio"
          aria-checked={checked}
          className={segmentedChipClassName(checked, { size })}
        >
          {option.label}
        </CustomLink>
      );
    })}
  </div>
);
