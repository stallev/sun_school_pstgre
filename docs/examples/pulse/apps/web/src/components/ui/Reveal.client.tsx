"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useRevealOnScroll } from "@/lib/ui/use-reveal-on-scroll";

type RevealElement = "div" | "section" | "article" | "p" | "h1" | "h2" | "h3";

export type RevealProps<T extends RevealElement = "div"> = {
  as?: T;
  delay?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Reveal<T extends RevealElement = "div">({
  as,
  delay,
  className,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as RevealElement;
  const { ref, revealed } = useRevealOnScroll();

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
        className,
      )}
      style={delay ? { transitionDelay: delay } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
