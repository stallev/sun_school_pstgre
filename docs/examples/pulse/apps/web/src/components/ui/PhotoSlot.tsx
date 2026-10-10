import { CameraIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

const photoSlotVariants = cva(
  "relative overflow-hidden rounded-2xl bg-muted",
  {
    variants: {
      aspect: {
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        cover: "aspect-[4/3]",
        banner: "aspect-[16/6]",
      },
    },
    defaultVariants: { aspect: "square" },
  },
);

export type PhotoSlotProps = React.ComponentProps<"div"> &
  VariantProps<typeof photoSlotVariants> & {
    label: string;
    src?: string | null;
    alt?: string;
    icon?: React.ReactNode;
    /** Passed to next/image — tune per layout (TrainerCard square ≈ 96px). */
    sizes?: string;
    /** When true, preloads image for LCP (maps to next/image `priority`). */
    priority?: boolean;
  };

export function PhotoSlot({
  label,
  src,
  alt,
  aspect,
  icon,
  sizes = "(max-width: 768px) 96px, 400px",
  priority = false,
  className,
  ...props
}: PhotoSlotProps) {
  const hasPhoto = Boolean(src?.trim());

  return (
    <div
      className={cn(photoSlotVariants({ aspect }), className)}
      {...props}
    >
      {hasPhoto ? (
        <Image
          src={src!}
          alt={alt ?? label}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent 0 8px, hsl(var(--primary) / 0.07) 8px 9px)",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-subtle-foreground">
            <span className="text-primary/70">
              {icon ?? <CameraIcon aria-hidden className="size-7" strokeWidth={1.5} />}
            </span>
            <ContentText
              variant="mutedMicro"
              as="span"
              className="font-mono uppercase tracking-wide"
            >
              {label}
            </ContentText>
          </div>
        </>
      )}
    </div>
  );
}
