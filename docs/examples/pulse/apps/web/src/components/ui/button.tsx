"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex cursor-pointer items-center justify-center gap-2",
    "rounded-full font-medium select-none whitespace-nowrap",
    "transition-[transform,background-color,box-shadow,border-color,color] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "data-[loading=true]:pointer-events-none data-[loading=true]:opacity-80",
    "active:scale-[0.97]",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[color:var(--forest)] hover:shadow-[var(--shadow-button-hover)]",
        outline:
          "border border-border bg-transparent text-primary hover:bg-primary-container/60",
        secondary:
          "bg-muted text-foreground hover:bg-[hsl(var(--color-surface-container))]",
        ghost: "text-primary hover:bg-primary-container/60",
        tonal:
          "bg-primary-container text-on-primary-container hover:bg-[hsl(var(--color-primary-container)/0.85)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95 hover:shadow-[var(--shadow-destructive-hover)]",
        link: "text-primary underline-offset-4 hover:underline rounded-none px-0 h-auto active:scale-100",
      },
      size: {
        xs: "h-8 px-3 text-[12px]",
        sm: "h-9 px-4 text-[13px]",
        default: "h-11 px-5 text-[14px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-11 w-11 p-0",
        "icon-xs": "h-8 w-8 p-0",
        "icon-sm": "h-9 w-9 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
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
    ref,
  ) => {
    const Comp: React.ElementType = asChild ? Slot.Root : "button";
    const isIconOnly = typeof size === "string" && size.startsWith("icon");

    if (
      process.env.NODE_ENV !== "production" &&
      isIconOnly &&
      !props["aria-label"] &&
      !props["aria-labelledby"]
    ) {
      console.warn("[Button] icon-only button requires an aria-label");
    }

    const isDisabled = Boolean(disabled || loading);

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
        {...(asChild
          ? {}
          : {
              type: props.type ?? "button",
              disabled: isDisabled,
              "data-loading": loading || undefined,
            })}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <span
                className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
