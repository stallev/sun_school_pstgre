"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type MarketingAccordionItem = {
  id: string;
  question: React.ReactNode;
  answer: React.ReactNode;
};

export type MarketingAccordionProps = {
  items: MarketingAccordionItem[];
  className?: string;
};

export function MarketingAccordion({ items, className }: MarketingAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={cn("mx-auto flex max-w-[720px] flex-col gap-1.5", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `${item.id}-panel`;
        const triggerId = `${item.id}-trigger`;

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-[18px] border border-foreground/6 bg-background"
          >
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full cursor-pointer items-center justify-between px-7 py-[22px] text-left transition-colors select-none hover:bg-muted"
            >
              <ContentText
                variant="smallEmphasis"
                as="span"
                className="pr-4 text-base font-semibold"
              >
                {item.question}
              </ContentText>
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                  isOpen
                    ? "rotate-45 bg-primary text-primary-foreground"
                    : "bg-primary-container text-primary",
                )}
              >
                <PlusIcon className="size-3.5" strokeWidth={2.5} />
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="px-7 pb-[22px]"
            >
              <ContentText variant="bodyMuted" as="p" className="text-[15px]">
                {item.answer}
              </ContentText>
            </div>
          </div>
        );
      })}
    </div>
  );
}
