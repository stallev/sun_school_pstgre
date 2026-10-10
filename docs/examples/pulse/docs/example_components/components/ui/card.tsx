import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* =============================================================================
 *  Card primitives (Shadcn-compatible)
 *  ────────────────────────────────────
 *  Kept as plain wrappers around <div>. They map to the design tokens so the
 *  rest of the system (Dialog, Sheet, etc.) inherits consistent surfaces.
 * ============================================================================ */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "font-heading text-xl leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

const CardAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
);
CardAction.displayName = "CardAction";

/* =============================================================================
 *  BsfyCard — design-system card with semantic CVA variants
 *  ─────────────────────────────────────────────────────────
 *  Variants
 *    base      standard content block (dashboards, forms, summaries)
 *    elevated  hero / primary CTA — no default padding, sections own theirs
 *    compact   list-item card (tasks, thoughts, students)
 *    row       horizontal flex row (task row, diary entry)
 *
 *  Modifiers
 *    interactive boolean   adds hover + focus affordances
 *    state       enum      default | active | warning | muted
 *
 *  Compound rule:
 *    interactive + state="muted" → strips hover; pointer-events disabled.
 *    Muted cards are non-actionable summaries.
 *
 *  Do NOT add forest / dark / cream background variants. Dark-background
 *  blocks are content panels, not cards — render those as plain <div>.
 * ============================================================================ */

export const bsfyCardVariants = cva(
  "bg-card text-card-foreground border border-[color:var(--cream-border)] transition-colors duration-150",
  {
    variants: {
      variant: {
        base: [
          "rounded-[var(--card-radius-lg)]",
          "shadow-[var(--shadow-card)]",
          "ring-1 ring-border/60",
          "p-[var(--card-p-md)]",
        ],
        elevated: [
          "rounded-[var(--card-radius-xl)]",
          "shadow-[var(--shadow-overlay)]",
          "overflow-hidden",
        ],
        compact: [
          "rounded-[var(--card-radius-md)]",
          "shadow-none",
          "p-[var(--card-p-sm)]",
        ],
        row: [
          "rounded-[var(--card-radius-sm)]",
          "shadow-none",
          "p-[var(--card-p-sm)]",
          "flex items-start gap-3",
        ],
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:border-[color:var(--forest-mid)]",
          "hover:shadow-[var(--shadow-overlay)]",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        ],
        false: "",
      },
      state: {
        default: "",
        active:  "border-[color:var(--forest-mid)] bg-[color:var(--green-soft)]",
        warning: "border-[color:var(--gold-light)] bg-[color:var(--amber-soft)]",
        muted:   "opacity-50",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        state: "muted",
        className: [
          "pointer-events-none",
          "cursor-default",
          "hover:border-[color:var(--cream-border)]",
          "hover:shadow-none",
        ],
      },
    ],
    defaultVariants: {
      variant: "base",
      interactive: false,
      state: "default",
    },
  }
);

export interface BsfyCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bsfyCardVariants> {}

const BsfyCard = React.forwardRef<HTMLDivElement, BsfyCardProps>(
  ({ className, variant, interactive, state, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(bsfyCardVariants({ variant, interactive, state }), className)}
      {...props}
    />
  )
);
BsfyCard.displayName = "BsfyCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  BsfyCard,
};
