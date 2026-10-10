import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ContentText, Heading } from "@/components/atoms";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { RatingStars } from "@/components/ui/RatingStars";
import { SpecChip } from "@/components/ui/SpecChip";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import { getMessages } from "@/lib/messages/server";

import { cn } from "@/lib/utils";

export type TrainerProfileHeaderProps = {
  profile: PublicTrainerProfile;
  className?: string;
};

export async function TrainerProfileHeader({ profile, className }: TrainerProfileHeaderProps) {
  const messages = await getMessages();
  const photoLabel = profile.fullName.split(" ")[0]?.toUpperCase() ?? "PHOTO";

  return (
    <section className={cn("-mx-4 md:mx-0", className)}>
      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="relative mx-auto w-full max-w-[360px] lg:mx-0 lg:w-72 lg:max-w-none lg:shrink-0">
          <PhotoSlot
            label={photoLabel}
            src={profile.photoUrl}
            alt={profile.fullName}
            aspect="portrait"
            sizes="(max-width: 1024px) min(100vw, 360px), 288px"
            className="w-full rounded-none md:rounded-3xl"
            priority
          />
          <div className="absolute left-3 top-3 flex items-center gap-2 md:left-4 md:top-4">
            <Link
              href="/trainers"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-card/95 shadow-sm backdrop-blur-sm"
              aria-label={messages.shell.back}
            >
              <ArrowLeftIcon className="size-5" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="relative z-10 -mt-6 min-w-0 flex-1 px-4 md:mt-4 md:px-0 lg:mt-0">
          <div className="min-w-0 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60 md:p-6">
            <div className="flex flex-wrap items-start gap-2">
              <Heading as="h1" visualLevel="h2" className="font-heading md:text-[34px]">
                {profile.fullName}
              </Heading>
              <VerifiedBadge>{messages.landing.featured.verifiedBadge}</VerifiedBadge>
            </div>

            {profile.bio ? (
              <ContentText variant="muted" as="p" className="mt-1 line-clamp-2">
                {profile.bio}
              </ContentText>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RatingStars value={profile.ratingAvg} size="sm" />
              <ContentText variant="mutedMicro" as="span" className="font-mono">
                {profile.ratingAvg.toFixed(1)}
              </ContentText>
              <ContentText variant="mutedMicro" as="span">
                · {profile.ratingCount} {messages.landing.featured.reviewsLabel}
              </ContentText>
              {profile.experienceYears ? (
                <ContentText variant="mutedMicro" as="span">
                  ·{" "}
                  {messages.trainer.profile.experienceLabel.replace(
                    "{years}",
                    String(profile.experienceYears),
                  )}
                </ContentText>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.specializations.map((spec) => (
                <SpecChip key={spec.slug}>{spec.name}</SpecChip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
