"use client";

import Link from "next/link";
import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { buttonVariants, type ButtonProps } from "./button";

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
type Mode = "text" | "button" | "icon";

type LinkProps = React.ComponentPropsWithoutRef<typeof Link>;

export type CustomLinkProps = Omit<LinkProps, "as"> & {
  as?: Mode;
  variant?: Variant | "quiet" | "action";
  size?: Size;
};

export const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
  (
    {
      as = "text",
      variant,
      size,
      className,
      children,
      href,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) => {
    if (
      process.env.NODE_ENV !== "production" &&
      as === "icon" &&
      !ariaLabel &&
      !rest["aria-labelledby"]
    ) {
      console.warn("[CustomLink] icon-only link requires an aria-label");
    }

    let resolvedClassName = className;

    if (as === "icon") {
      resolvedClassName = cn(
        buttonVariants({
          variant: (variant as Variant | undefined) ?? "ghost",
          size: size ?? "icon-sm",
        }),
        "cursor-pointer",
        className,
      );
    } else if (as === "button") {
      resolvedClassName = cn(
        buttonVariants({
          variant: (variant as Variant | undefined) ?? "default",
          size: size ?? "default",
        }),
        className,
      );
    } else {
      const isQuiet = variant === "quiet";
      const isAction = variant === "action";
      resolvedClassName = cn(
        "cursor-pointer font-medium underline-offset-4 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
        isQuiet
          ? "text-[12px] text-muted-foreground hover:text-foreground hover:underline"
          : isAction
            ? "text-[13px] text-primary inline-flex items-center gap-0.5 hover:underline"
            : "text-[13px] text-primary inline-flex items-center gap-0.5 hover:underline",
        className,
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        aria-label={ariaLabel}
        className={resolvedClassName}
        {...rest}
      >
        {children}
      </Link>
    );
  },
);
CustomLink.displayName = "CustomLink";

export type { ButtonProps };
