"use client";

import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "@/components/shell/ThemeToggle.client";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { LAB_SECTIONS, VIEWPORT_WIDTHS } from "@/lib/design-lab/matrices";

type DesignLabShellProps = {
  children: React.ReactNode;
};

export function DesignLabShell({ children }: DesignLabShellProps) {
  const [viewport, setViewport] =
    useState<(typeof VIEWPORT_WIDTHS)[number]>(390);

  return (
    <div className="min-h-full bg-background">
      <nav
        aria-label="Design lab controls"
        className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <Container
          variant="shell"
          className="flex flex-wrap items-center gap-3 py-3"
        >
          <div className="flex flex-wrap gap-1">
            {LAB_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                prefetch={false}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {section.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Viewport width"
              className="flex rounded-full border border-border p-0.5"
            >
              {VIEWPORT_WIDTHS.map((width) => (
                <button
                  key={width}
                  type="button"
                  aria-pressed={viewport === width}
                  onClick={() => setViewport(width)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    viewport === width
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {width}px
                </button>
              ))}
            </div>
            <ThemeToggle showLabel size="sm" />
          </div>
        </Container>
      </nav>
      <div
        className="@container/design-lab mx-auto w-full transition-[max-width] duration-200"
        style={{ maxWidth: viewport }}
      >
        {children}
      </div>
    </div>
  );
}
