"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonProps } from "./button";
import { type VariantProps } from "class-variance-authority";

/**
 * CustomLink — the single point for ALL anchors in product code.
 *
 *  Three rendering modes (controlled by `as`):
 *
 *   as="text"   (default)   plain in-content link styled as an underline-on-hover
 *                           link. Pass `variant="quiet"` to drop the colour for
 *                           muted footer / breadcrumb links.
 *
 *   as="button"             link styled as a Button via `buttonVariants`.
 *                           Pass `variant` + `size` from the Button spec.
 *                           Semantics stay `<a>` — keyboard, right-click, copy
 *                           all behave like a link.
 *
 *   as="icon"                icon-only link. Always sets `cursor-pointer` and
 *                           validates `aria-label` in development.
 *
 *  Composability with Next.js
 *  ──────────────────────────
 *   Wrap with <Link asChild> or pass the rendered <CustomLink/> as the child
 *   of a Next.js <Link>:
 *
 *      <Link href="/trainers" passHref legacyBehavior>
 *        <CustomLink as="button" variant="default">Browse</CustomLink>
 *      </Link>
 *
 *   In App-Router projects the simpler pattern is to just use the `href`
 *   prop on CustomLink directly — Next.js intercepts plain <a> in client
 *   components via the router, OR pass `asChild` upstream and let the parent
 *   <Link> own the href.
 */
type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

type Mode = "text" | "button" | "icon";

interface BaseProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type"> {
  as?: Mode;
  variant?: Variant | "quiet";
  size?: Size;
}

export interface CustomLinkProps extends BaseProps {}

export const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
  (
    {
      as = "text",
      variant,
      size,
      className,
      children,
      "aria-label": ariaLabel,
      ...rest
    },
    ref
  ) => {
    /* ─── icon-only ─────────────────────────────────────────────────── */
    if (as === "icon") {
      if (
        process.env.NODE_ENV !== "production" &&
        !ariaLabel &&
        !rest["aria-labelledby"]
      ) {
        // eslint-disable-next-line no-console
        console.warn("[CustomLink] icon-only link requires an aria-label");
      }
      return (
        <a
          ref={ref}
          aria-label={ariaLabel}
          className={cn(
            buttonVariants({
              variant: (variant as Variant | undefined) ?? "ghost",
              size: size ?? "icon-sm",
            }),
            "cursor-pointer",
            className
          )}
          {...rest}
        >
          {children}
        </a>
      );
    }

    /* ─── button-styled link ────────────────────────────────────────── */
    if (as === "button") {
      return (
        <a
          ref={ref}
          className={cn(
            buttonVariants({
              variant: (variant as Variant | undefined) ?? "default",
              size: size ?? "default",
            }),
            className
          )}
          {...rest}
        >
          {children}
        </a>
      );
    }

    /* ─── plain text link ───────────────────────────────────────────── */
    const isQuiet = variant === "quiet";
    return (
      <a
        ref={ref}
        className={cn(
          "underline-offset-4 hover:underline transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
          isQuiet ? "text-muted-foreground hover:text-foreground" : "text-primary",
          className
        )}
        {...rest}
      >
        {children}
      </a>
    );
  }
);
CustomLink.displayName = "CustomLink";

export type { ButtonProps };
