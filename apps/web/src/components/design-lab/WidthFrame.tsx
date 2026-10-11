"use client";

import { useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";

const WIDTHS = [
  { value: "390", label: "390" },
  { value: "768", label: "768" },
  { value: "1280", label: "1280" },
] as const;

const FRAME_CLASS = {
  "390": "max-w-[390px]",
  "768": "max-w-[768px]",
  "1280": "max-w-[1280px]",
} as const;

type WidthFrameProps = {
  children: ReactNode;
};

/** Constrains its content to a container width to preview 390 / 768 / 1280 px layouts. */
export const WidthFrame = ({ children }: WidthFrameProps) => {
  const [width, setWidth] = useState<"390" | "768" | "1280">("390");
  return (
    <div className="space-y-3">
      <SegmentedControl
        aria-label="Container width, px"
        options={WIDTHS}
        value={width}
        onValueChange={setWidth}
      />
      <div className="overflow-x-auto rounded-xl border border-dashed border-line-strong bg-paper p-3">
        <div className={`mx-auto w-full ${FRAME_CLASS[width]}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
