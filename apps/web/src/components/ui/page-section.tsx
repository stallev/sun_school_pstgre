import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

const WIDTH_CLASS = {
  full: "",
  wide: "max-w-5xl",
  form: "max-w-3xl",
} as const;

export type PageSectionWidth = keyof typeof WIDTH_CLASS;

type PageSectionProps<T extends ElementType> = {
  as?: T;
  width?: PageSectionWidth;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "width" | "className">;

export const PageSection = <T extends ElementType = "section">({
  as,
  width = "full",
  className,
  ...props
}: PageSectionProps<T>) => {
  const Component = as ?? "section";
  return (
    <Component
      className={cn("w-full", WIDTH_CLASS[width], className)}
      {...props}
    />
  );
};
