import { SearchIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type SearchTriggerProps = Omit<
  React.ComponentProps<typeof Link>,
  "href"
> & {
  href: string;
  placeholder?: string;
};

export function SearchTrigger({
  href,
  placeholder = "Search by name or specialty",
  className,
  ...props
}: SearchTriggerProps) {
  return (
    <Link
      href={href}
      aria-label={placeholder}
      className={cn(
        "relative flex h-11 w-full items-center rounded-full border border-border bg-card px-4 pl-10 text-sm text-muted-foreground transition-colors",
        "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
        "md:h-12",
        className,
      )}
      {...props}
    >
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute left-3.5 size-[18px] text-subtle-foreground"
      />
      {placeholder}
    </Link>
  );
}
