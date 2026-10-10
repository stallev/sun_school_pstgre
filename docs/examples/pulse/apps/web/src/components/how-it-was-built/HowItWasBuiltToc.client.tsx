"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { cn } from "@/lib/utils";

const SECTION_IDS = [
  "overview",
  "timeline",
  "product",
  "architecture",
  "methodology",
  "roadmap",
  "stack",
  "observability",
  "developer",
] as const;

type TocItem = { id: string; label: string };

type TocContextValue = {
  items: readonly TocItem[];
  activeId: string;
  ariaLabel: string;
  label: string;
};

const TocContext = createContext<TocContextValue | null>(null);

function useTocContext() {
  const context = useContext(TocContext);
  if (!context) {
    throw new Error("HowItWasBuiltToc components must be used within HowItWasBuiltTocProvider");
  }
  return context;
}

export function HowItWasBuiltTocProvider({ children }: { children: ReactNode }) {
  const messages = useMessages();
  const { toc } = messages.howItWasBuilt;
  const [activeId, setActiveId] = useState<string>(SECTION_IDS[0]);

  const items = useMemo(
    () =>
      SECTION_IDS.map((id) => ({
        id,
        label: messages.howItWasBuilt[id].title,
      })),
    [messages],
  );

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const value = useMemo(
    () => ({ items, activeId, ariaLabel: toc.ariaLabel, label: toc.label }),
    [items, activeId, toc.ariaLabel, toc.label],
  );

  return <TocContext.Provider value={value}>{children}</TocContext.Provider>;
}

export function HowItWasBuiltTocMobile() {
  const { items, activeId, ariaLabel } = useTocContext();

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-[72px] z-40 -mx-6 border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-xl lg:hidden"
    >
      <ul className="flex gap-2 overflow-x-auto no-scrollbar">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className={cn(
                "inline-flex rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                activeId === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function HowItWasBuiltTocDesktop() {
  const { items, activeId, ariaLabel, label } = useTocContext();

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-[96px] hidden max-h-[calc(100dvh-120px)] overflow-y-auto lg:block"
    >
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="space-y-1 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors",
                activeId === item.id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
              aria-current={activeId === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
