import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Layout width + gutters aligned with Fitness_Platform_Prototype_v1.html
 * and PageContainer in global_shell_spec.
 *
 * Width-only variants (narrow … full) assume horizontal padding from a parent
 * `shell` / `page` container — see prototype `<main>` + inner `md:max-w-*`.
 */
export const containerVariants = cva("mx-auto w-full", {
  variants: {
    variant: {
      shell: "max-w-[1400px] px-4 md:px-6 lg:px-8",
      /** Main column inside AppShellCanvas — width from parent shell container */
      shellMain:
        "min-w-0 flex-1 px-4 pt-4 md:px-6 md:pt-6 lg:px-8",
      page: "max-w-[1400px] px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-6",
      narrow: "max-w-md",
      form: "md:max-w-2xl",
      content: "md:max-w-4xl",
      wide: "md:max-w-5xl",
      full: "max-w-none",
      /** Public landing / marketing sections — standalone prototype max width */
      marketing: "max-w-[1280px] px-6 md:px-14",
    },
  },
  defaultVariants: { variant: "shell" },
});

type ContainerTag = "div" | "main" | "section" | "article";

export type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & {
    as?: ContainerTag;
  };

export function Container({
  as: As = "div",
  variant,
  className,
  ...props
}: ContainerProps) {
  return (
    <As className={cn(containerVariants({ variant }), className)} {...props} />
  );
}
