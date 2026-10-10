"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — single source of truth for all clickable actions.
 *
 *  Variants
 *  ────────
 *   default      — primary CTA (filled forest). One per screen / section.
 *   outline      — secondary / "Cancel" actions.
 *   secondary    — neutral filled (cream surface).
 *   ghost        — tertiary, inline navigation actions.
 *   tonal        — soft brand container (forest-faint). Use for grouped
 *                  secondary actions where outline would feel too heavy.
 *   destructive  — only inside confirm dialogs.
 *   link         — text-only action that should still feel like a button.
 *
 *  Role / domain variants (only inside their scope)
 *  ────────────────────────────────────────────────
 *   leaderPrimaryCta  — emphasised primary in leader screens (gold).
 *   editorSave        — explicit "Save" in editor contexts.
 *   submitDay         — green "submit today" in student lesson flow.
 *
 *  Sizes (touch target ≥ 44px on `default+`)
 *  ─────────────────────────────────────────
 *   xs · sm · default · lg
 *   icon · icon-xs · icon-sm · icon-lg
 *
 *  States
 *  ──────
 *   default / hover / focus-visible / disabled / loading
 *   `loading` disables interaction and shows a spinner before children.
 *
 *  Accessibility
 *  ─────────────
 *   - icon-* size + no visible text ⇒ MUST pass `aria-label`.
 *   - Keep buttons as <button>; for links styled as buttons, use <CustomLink>.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-full font-medium select-none whitespace-nowrap",
    "transition-[transform,background-color,box-shadow,border-color,color] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "data-[loading=true]:pointer-events-none data-[loading=true]:opacity-80",
    "active:scale-[0.97]",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color:var(--forest)] hover:shadow-[var(--shadow-hover)]",
        outline:
          "border border-border bg-transparent text-primary hover:bg-primary-container/60",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost:
          "text-primary hover:bg-primary-container/60",
        tonal:
          "bg-primary-container text-on-primary-container hover:brightness-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95 hover:shadow-[var(--shadow-hover)]",
        link:
          "text-primary underline-offset-4 hover:underline rounded-none px-0 h-auto active:scale-100",

        /* Role / domain — keep scoped */
        leaderPrimaryCta:
          "bg-[color:var(--gold)] text-[color:var(--forest)] hover:bg-[color:var(--gold-light)] hover:shadow-[var(--shadow-hover)]",
        editorSave:
          "bg-primary text-primary-foreground hover:bg-[color:var(--forest)]",
        submitDay:
          "bg-[color:var(--green-text)] text-white hover:brightness-95",
      },
      size: {
        xs:        "h-8  px-3  text-[12px]",
        sm:        "h-9  px-4  text-[13px]",
        default:   "h-11 px-5  text-[14px]",
        lg:        "h-12 px-6  text-[15px]",
        icon:      "h-11 w-11  p-0",
        "icon-xs": "h-8  w-8   p-0",
        "icon-sm": "h-9  w-9   p-0",
        "icon-lg": "h-12 w-12  p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the styled element as its child (Radix Slot). */
  asChild?: boolean;
  /** Show a spinner and prevent interaction. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp: React.ElementType = asChild ? Slot : "button";
    const isIconOnly = typeof size === "string" && size.startsWith("icon");

    // Dev-time a11y hint for icon-only buttons.
    if (
      process.env.NODE_ENV !== "production" &&
      isIconOnly &&
      !props["aria-label"] &&
      !props["aria-labelledby"]
    ) {
      // eslint-disable-next-line no-console
      console.warn("[Button] icon-only button requires an aria-label");
    }

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (props.type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
