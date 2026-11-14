"use client";

import { useEffect, useState, type MouseEvent } from "react";

import { SectionTitle } from "@/components/atoms/SectionTitle";
import { CustomLink } from "@/components/ui/custom-link";
import type { GuideTocSectionGroup } from "@/lib/guide/build-guide-toc-groups";
import { cn } from "@/lib/utils";

const TOC_ID = "guide-toc";

type GuideTocProps = {
  heading: string;
  jumpLabel: string;
  groups: GuideTocSectionGroup[];
};

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const GuideToc = ({ heading, jumpLabel, groups }: GuideTocProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTocVisible, setIsTocVisible] = useState(true);

  useEffect(() => {
    const ids = groups.flatMap((group) => group.sections.map((section) => section.id));
    const targets = ids.flatMap((id) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    const visible = new Set<string>();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActiveId(ids.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-72px 0px -60% 0px" },
    );
    targets.forEach((target) => sectionObserver.observe(target));

    const tocElement = document.getElementById(TOC_ID);
    const tocObserver = new IntersectionObserver(([entry]) => {
      if (entry) setIsTocVisible(entry.isIntersecting);
    });
    if (tocElement) tocObserver.observe(tocElement);

    return () => {
      sectionObserver.disconnect();
      tocObserver.disconnect();
    };
  }, [groups]);

  const handleJumpToToc = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document
      .getElementById(TOC_ID)
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <nav
        id={TOC_ID}
        aria-label={heading}
        className="rounded-xl border border-line bg-surface p-card"
      >
        <SectionTitle as="h2" className="mb-3 text-base">
          {heading}
        </SectionTitle>
        <div className="flex flex-col gap-stack">
          {groups.map((group, index) => (
            <div key={group.title ?? `group-${index}`}>
              {group.title ? (
                <p className="mb-2 text-sm font-medium text-muted">{group.title}</p>
              ) : null}
              <ul className="flex flex-col gap-chip">
                {group.sections.map((section) => (
                  <li key={section.id}>
                    <CustomLink
                      href={`#${section.id}`}
                      aria-current={activeId === section.id ? "location" : undefined}
                      className={cn(
                        "inline-flex min-h-8 items-center py-hint text-base font-normal",
                        activeId === section.id && "font-bold text-cobalt-ink",
                      )}
                    >
                      {section.title}
                    </CustomLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      {isTocVisible ? null : (
        <a
          href={`#${TOC_ID}`}
          onClick={handleJumpToToc}
          className="fixed right-page bottom-section z-30 inline-flex h-11 items-center rounded-lg bg-cobalt-ink px-card text-base font-medium text-primary-foreground no-underline shadow-float hover:bg-cobalt-deep lg:hidden"
        >
          {jumpLabel}
        </a>
      )}
    </>
  );
};
