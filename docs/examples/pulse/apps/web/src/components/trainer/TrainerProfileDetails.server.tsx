import dynamic from "next/dynamic";

import { TrainerProfileAboutTab } from "@/components/trainer/TrainerProfileAboutTab";
import { TrainerProfileServicesTab } from "@/components/trainer/TrainerProfileServicesTab";
import { TrainerProfileTabsShellDeferred } from "@/components/trainer/TrainerProfileTabsShellDeferred.client";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { getMessages } from "@/lib/messages/server";

const TrainerProfileBookSidebar = dynamic(
  () =>
    import("@/components/trainer/TrainerProfileBookSidebar.client").then(
      (module) => ({ default: module.TrainerProfileBookSidebar }),
    ),
);

const TrainerProfileStickyBar = dynamic(
  () =>
    import("@/components/trainer/TrainerProfileStickyBar.client").then(
      (module) => ({ default: module.TrainerProfileStickyBar }),
    ),
);

export type TrainerProfileDetailsProps = {
  profile: PublicTrainerProfile;
};

export async function TrainerProfileDetails({
  profile,
}: TrainerProfileDetailsProps) {
  const [messages, session] = await Promise.all([
    getMessages(),
    getPolicySessionContext(),
  ]);
  const isAuthenticated = Boolean(session);
  const slotDurationMinutes = profile.services[0]?.durationMinutes ?? 60;

  return (
    <>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-6">
        <div className="min-w-0 space-y-4">
          <TrainerProfileTabsShellDeferred
            labels={{
              about: messages.trainer.profile.tabs.about,
              services: messages.trainer.profile.tabs.services,
              schedule: messages.trainer.profile.tabs.schedule,
              reviews: messages.trainer.profile.tabs.reviews,
            }}
            trainerProfileId={profile.id}
            slotDurationMinutes={slotDurationMinutes}
            about={<TrainerProfileAboutTab profile={profile} />}
            services={<TrainerProfileServicesTab profile={profile} />}
          />
        </div>

        <TrainerProfileBookSidebar
          profile={profile}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <TrainerProfileStickyBar
        profile={profile}
        isAuthenticated={isAuthenticated}
        withBottomNavOffset={isAuthenticated}
      />
    </>
  );
}
