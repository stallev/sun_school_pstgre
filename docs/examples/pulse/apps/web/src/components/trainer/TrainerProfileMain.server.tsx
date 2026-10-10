import { Suspense } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TrainerProfileAboutTab } from "@/components/trainer/TrainerProfileAboutTab";
import { TrainerProfileBookSidebar } from "@/components/trainer/TrainerProfileBookSidebar.client";
import { TrainerProfileHeader } from "@/components/trainer/TrainerProfileHeader";
import { TrainerProfileReviewsSection } from "@/components/trainer/TrainerProfileReviewsSection.server";
import { TrainerProfileReviewsSkeleton } from "@/components/trainer/TrainerProfileReviewsSkeleton";
import { TrainerProfileScheduleSection } from "@/components/trainer/TrainerProfileScheduleSection.server";
import { TrainerProfileServicesTab } from "@/components/trainer/TrainerProfileServicesTab";
import { TrainerProfileStickyBar } from "@/components/trainer/TrainerProfileStickyBar.client";
import { TrainerSchedulePreviewSkeleton } from "@/components/trainer/TrainerSchedulePreviewSkeleton";
import { getPublicTrainerProfile } from "@/data/trainer/get-public-trainer-profile.server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import { getMessages } from "@/lib/messages/server";
import { connection } from "next/server";

export type TrainerProfileMainProps = {
  trainerId: string;
};

export async function TrainerProfileMain({
  trainerId,
}: TrainerProfileMainProps) {
  await connection();
  const [messages, profile, session] = await Promise.all([
    getMessages(),
    getPublicTrainerProfile(trainerId),
    getPolicySessionContext(),
  ]);
  const isAuthenticated = Boolean(session);
  const slotDurationMinutes = profile.services[0]?.durationMinutes ?? 60;

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-6">
        <div className="min-w-0 space-y-4">
          <TrainerProfileHeader profile={profile} />

          <Tabs defaultValue="about" className="px-0">
            <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 no-scrollbar md:mx-0 md:overflow-visible md:px-0">
              <TabsList variant="pill" className="w-max md:w-full md:justify-start">
                <TabsTrigger value="about" className="shrink-0 flex-none">
                  {messages.trainer.profile.tabs.about}
                </TabsTrigger>
                <TabsTrigger value="services" className="shrink-0 flex-none">
                  {messages.trainer.profile.tabs.services}
                </TabsTrigger>
                <TabsTrigger value="schedule" className="shrink-0 flex-none">
                  {messages.trainer.profile.tabs.schedule}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="shrink-0 flex-none">
                  {messages.trainer.profile.tabs.reviews}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="about" className="mt-4">
              <TrainerProfileAboutTab profile={profile} />
            </TabsContent>

            <TabsContent value="services" className="mt-4">
              <TrainerProfileServicesTab profile={profile} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <Suspense fallback={<TrainerSchedulePreviewSkeleton />}>
                <TrainerProfileScheduleSection
                  trainerProfileId={profile.id}
                  slotDurationMinutes={slotDurationMinutes}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <Suspense fallback={<TrainerProfileReviewsSkeleton />}>
                <TrainerProfileReviewsSection trainerProfileId={profile.id} />
              </Suspense>
            </TabsContent>
          </Tabs>
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
    </div>
  );
}
