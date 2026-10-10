"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";

import { ContentText } from "@/components/atoms";
import { DayPill } from "@/components/ui/DayPill";
import { cn } from "@/lib/utils";

import type { ScheduleDay } from "./SchedulePicker.client";

type ScrollSource = "tap" | "swipe" | "external";

export type ScheduleDayPickerRowProps = {
  days: ReadonlyArray<ScheduleDay>;
  activeDayId: string;
  onDayChange: (dayId: string) => void;
  swipeHint?: string;
  className?: string;
};

function getScrollBehavior(source: ScrollSource): ScrollBehavior {
  if (typeof window === "undefined") return "smooth";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || source === "swipe") return "instant";
  return "smooth";
}

function isScrollableRow(scroller: HTMLDivElement): boolean {
  return scroller.scrollWidth > scroller.clientWidth + 1;
}

export function ScheduleDayPickerRow({
  days,
  activeDayId,
  onDayChange,
  swipeHint,
  className,
}: ScheduleDayPickerRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef(new Map<string, HTMLButtonElement>());
  const scrollSourceRef = useRef<ScrollSource>("external");
  const activeDayIdRef = useRef(activeDayId);

  useEffect(() => {
    activeDayIdRef.current = activeDayId;
  }, [activeDayId]);

  const scrollDayIntoView = useCallback((dayId: string, source: ScrollSource) => {
    const scroller = scrollerRef.current;
    const pill = pillRefs.current.get(dayId);
    if (!scroller || !pill || !isScrollableRow(scroller)) return;

    pill.scrollIntoView({
      behavior: getScrollBehavior(source),
      inline: "center",
      block: "nearest",
    });
  }, []);

  const syncSelectionFromScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scrollSourceRef.current === "tap" || !isScrollableRow(scroller)) {
      return;
    }

    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestId = activeDayIdRef.current;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const day of days) {
      const pill = pillRefs.current.get(day.id);
      if (!pill) continue;

      const pillCenter = pill.offsetLeft + pill.offsetWidth / 2;
      const distance = Math.abs(center - pillCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = day.id;
      }
    }

    if (closestId !== activeDayIdRef.current) {
      scrollSourceRef.current = "swipe";
      onDayChange(closestId);
    }
  }, [days, onDayChange]);

  const isMountedRef = useRef(false);

  useEffect(() => {
    const source = isMountedRef.current ? scrollSourceRef.current : "external";
    scrollDayIntoView(activeDayId, source);
    scrollSourceRef.current = "external";
    isMountedRef.current = true;
  }, [activeDayId, scrollDayIntoView]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScrollEnd = () => syncSelectionFromScroll();
    scroller.addEventListener("scrollend", handleScrollEnd);

    let debounceId: ReturnType<typeof setTimeout> | undefined;
    const handleScroll = () => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(handleScrollEnd, 120);
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scrollend", handleScrollEnd);
      scroller.removeEventListener("scroll", handleScroll);
      if (debounceId) clearTimeout(debounceId);
    };
  }, [syncSelectionFromScroll]);

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" && index < days.length - 1) {
      event.preventDefault();
      scrollSourceRef.current = "tap";
      onDayChange(days[index + 1].id);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      scrollSourceRef.current = "tap";
      onDayChange(days[index - 1].id);
    }
  };

  return (
    <div className={cn("relative min-w-0 w-full -mx-5 md:mx-0", className)}>
      <ChevronLeftIcon
        aria-hidden
        className="pointer-events-none absolute left-1 top-[calc(50%-0.625rem)] z-20 size-4 -translate-y-1/2 text-muted-foreground/45 md:hidden"
      />
      <ChevronRightIcon
        aria-hidden
        className="pointer-events-none absolute right-1 top-[calc(50%-0.625rem)] z-20 size-4 -translate-y-1/2 text-muted-foreground/45 md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card via-card/80 to-transparent md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card via-card/80 to-transparent md:hidden"
      />
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Select day"
        className={cn(
          "flex w-full min-w-0 max-w-full gap-2.5 px-5 pb-1 md:grid md:grid-cols-7 md:gap-2 md:overflow-visible md:px-0",
          "max-md:overflow-x-auto max-md:overflow-y-hidden max-md:no-scrollbar",
          "max-md:snap-x max-md:snap-mandatory max-md:scroll-px-5",
          "max-md:touch-pan-x max-md:overscroll-x-contain max-md:[-webkit-overflow-scrolling:touch]",
        )}
      >
        {days.map((day, index) => {
          const selected = day.id === activeDayId;
          return (
            <DayPill
              key={day.id}
              ref={(node) => {
                if (node) pillRefs.current.set(day.id, node);
                else pillRefs.current.delete(day.id);
              }}
              role="tab"
              id={`schedule-day-${day.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              weekday={day.weekday}
              day={day.day}
              selected={selected}
              onClick={() => {
                scrollSourceRef.current = "tap";
                onDayChange(day.id);
              }}
              onKeyDown={(event) => handleDayKeyDown(event, index)}
              className="max-md:snap-center max-md:shrink-0 md:w-full md:min-w-0"
            />
          );
        })}
      </div>
      {swipeHint ? (
        <ContentText
          variant="mutedMicro"
          as="p"
          className="mt-2.5 px-5 text-center md:hidden"
        >
          {swipeHint}
        </ContentText>
      ) : null}
    </div>
  );
}
