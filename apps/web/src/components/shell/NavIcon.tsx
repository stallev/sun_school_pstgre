import { createElement } from "react";
import { getNavIcon } from "@/components/shell/nav-icons";
import { cn } from "@/lib/utils";

type NavIconProps = {
  navKey: string;
  className?: string;
};

export const NavIcon = ({ navKey, className }: NavIconProps) => {
  const icon = getNavIcon(navKey);
  if (!icon) return null;
  return createElement(icon, {
    className: cn("size-4 shrink-0", className),
    "aria-hidden": true,
  });
};
