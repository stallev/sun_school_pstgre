"use client";

import { FilterIcon } from "lucide-react";
import { useState } from "react";

import { ContentText } from "@/components/atoms";
import { IconBadge } from "@/components/ui/IconBadge";
import { FilterChip } from "@/components/ui/FilterChip";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { RatingStars } from "@/components/ui/RatingStars";
import { SpecChip } from "@/components/ui/SpecChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";
import {
  AVATAR_SIZES,
  FILTER_CHIP_OPTIONS,
  RATING_STAR_SIZES,
  STATUS_BADGE_MATRIX,
} from "@/lib/design-lab/matrices";

export function DesignLabMedia() {
  const [activeChip, setActiveChip] = useState("all");
  const [rating, setRating] = useState(4);

  return (
    <DesignLabSection id="media" title="L2 — Media & chips">
      <div className="space-y-8">
        <div>
          <VariantLabel>RatingStars — readonly (gold / text-secondary)</VariantLabel>
          <div className="flex flex-wrap items-center gap-4">
            {RATING_STAR_SIZES.map((size) => (
              <div key={size} className="flex items-center gap-2">
                <RatingStars value={4.9} size={size} />
                <ContentText variant="mutedMicro" as="span" className="font-mono">
                  {size}
                </ContentText>
              </div>
            ))}
          </div>
        </div>

        <div>
          <VariantLabel>RatingStars — interactive (review form)</VariantLabel>
          <RatingStars
            interactive
            value={rating}
            onChange={setRating}
            aria-label="Your rating"
          />
        </div>

        <div>
          <VariantLabel>SpecChip — display only</VariantLabel>
          <div className="flex flex-wrap gap-1.5">
            {["HIIT", "Pilates", "Stretching", "+2"].map((label) => (
              <SpecChip key={label}>{label}</SpecChip>
            ))}
          </div>
        </div>

        <div>
          <VariantLabel>FilterChip — c.catalog mobile chips</VariantLabel>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {FILTER_CHIP_OPTIONS.map((chip) => (
              <FilterChip
                key={chip.id}
                selected={activeChip === chip.id}
                onClick={() => setActiveChip(chip.id)}
              >
                {chip.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <VariantLabel>PhotoSlot — with photo / Lucide placeholder</VariantLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            <PhotoSlot
              label="Photo · Anna"
              aspect="square"
              src="https://picsum.photos/seed/pulse-trainer-anna/400/400"
              alt="Anna Cardio"
            />
            <PhotoSlot
              label="Portrait · Profile"
              aspect="portrait"
              src="https://picsum.photos/seed/pulse-trainer-portrait/600/800"
              alt="Trainer portrait"
            />
            <PhotoSlot label="No photo · Dmitry" aspect="cover" />
            <PhotoSlot label="Banner · Hero" aspect="banner" className="sm:col-span-1" />
          </div>
        </div>

        <div>
          <VariantLabel>UserAvatar — photo / UserRound placeholder</VariantLabel>
          <div className="flex flex-wrap items-end gap-3">
            <UserAvatar
              name="Alex Client"
              src="https://picsum.photos/seed/pulse-client-alex/400/400"
              size="lg"
            />
            <UserAvatar name="Max Client" size="lg" />
            {AVATAR_SIZES.map((size) => (
              <UserAvatar key={size} name="Nina Client" size={size} />
            ))}
          </div>
        </div>

        <div>
          <VariantLabel>Tabs — pill variant (trainer profile)</VariantLabel>
          <Tabs defaultValue="about">
            <TabsList variant="pill">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <VariantLabel>StatusBadge + VerifiedBadge</VariantLabel>
          <div className="flex flex-wrap gap-2">
            {STATUS_BADGE_MATRIX.map(({ status, label }) => (
              <StatusBadge key={status} status={status}>
                {label}
              </StatusBadge>
            ))}
            <VerifiedBadge />
          </div>
        </div>

        <div>
          <VariantLabel>IconBadge — admin nav counts</VariantLabel>
          <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border">
            <FilterIcon aria-hidden className="size-[18px] text-muted-foreground" />
            <IconBadge count={3} className="absolute -top-1 -right-1" />
          </div>
        </div>
      </div>
    </DesignLabSection>
  );
}
