import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export const pulseCardVariants = cva(
  "border border-[color:var(--cream-border)] bg-card text-card-foreground transition-[box-shadow,border-color,background-color,transform] duration-150",
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
          "flex min-w-0 items-start gap-3",
        ],
        catalog: [
          "rounded-2xl",
          "shadow-[var(--shadow-card)]",
          "ring-1 ring-border/60",
          "overflow-hidden",
          "p-0",
        ],
        kpi: [
          "rounded-[var(--card-radius-md)]",
          "shadow-[var(--shadow-card)]",
          "ring-1 ring-border/60",
          "p-[var(--card-p-kpi)]",
          "min-w-0",
        ],
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:border-[color:var(--forest-mid)]",
          "hover:shadow-[var(--shadow-overlay)]",
          "active:scale-[0.99]",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        ],
        false: "",
      },
      state: {
        default: "",
        active:
          "border-[color:var(--forest-mid)] bg-[color:var(--green-soft)]",
        warning:
          "border-[color:var(--gold-light)] bg-[color:var(--amber-soft)]",
        muted: "opacity-50",
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
          "active:scale-100",
        ],
      },
    ],
    defaultVariants: {
      variant: "base",
      interactive: false,
      state: "default",
    },
  },
)

function PulseCard({
  className,
  variant,
  interactive,
  state,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof pulseCardVariants>) {
  return (
    <div
      data-slot="pulse-card"
      className={cn(
        pulseCardVariants({ variant, interactive, state }),
        className,
      )}
      {...props}
    />
  )
}

function PulseCardContent({
  className,
  density = "md",
  ...props
}: React.ComponentProps<"div"> & { density?: "sm" | "md" | "lg" }) {
  return (
    <div
      data-slot="pulse-card-content"
      className={cn(
        "min-w-0",
        density === "sm" && "p-[var(--card-p-sm)]",
        density === "md" && "p-[var(--card-p-md)]",
        density === "lg" && "p-[var(--card-p-lg)]",
        className,
      )}
      {...props}
    />
  )
}

export type PulseCardProps = React.ComponentProps<typeof PulseCard>

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  PulseCard,
  PulseCardContent,
}
