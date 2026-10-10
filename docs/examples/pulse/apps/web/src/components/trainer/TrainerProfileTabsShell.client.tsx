"use client";

import { useState, type ReactNode } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TrainerProfileReviewsTabPanel } from "@/components/trainer/TrainerProfileReviewsTabPanel.client";
import { TrainerProfileScheduleTabPanel } from "@/components/trainer/TrainerProfileScheduleTabPanel.client";

export type TrainerProfileTabLabels = {
  about: string;
  services: string;
  schedule: string;
  reviews: string;
};

export type TrainerProfileTabsShellProps = {
  labels: TrainerProfileTabLabels;
  trainerProfileId: string;
  slotDurationMinutes: number;
  about: ReactNode;
  services: ReactNode;
};

export function TrainerProfileTabsShell({
  labels,
  trainerProfileId,
  slotDurationMinutes,
  about,
  services,
}: TrainerProfileTabsShellProps) {
  const [activeTab, setActiveTab] = useState("about");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="px-0">
      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 no-scrollbar md:mx-0 md:overflow-visible md:px-0">
        <TabsList variant="pill" className="w-max md:w-full md:justify-start">
          <TabsTrigger value="about" className="shrink-0 flex-none">
            {labels.about}
          </TabsTrigger>
          <TabsTrigger value="services" className="shrink-0 flex-none">
            {labels.services}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="shrink-0 flex-none">
            {labels.schedule}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="shrink-0 flex-none">
            {labels.reviews}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="about" className="mt-4">
        {about}
      </TabsContent>

      <TabsContent value="services" className="mt-4">
        {services}
      </TabsContent>

      <TabsContent value="schedule" className="mt-4">
        {activeTab === "schedule" ? (
          <TrainerProfileScheduleTabPanel
            trainerProfileId={trainerProfileId}
            slotDurationMinutes={slotDurationMinutes}
          />
        ) : null}
      </TabsContent>

      <TabsContent value="reviews" className="mt-4">
        {activeTab === "reviews" ? (
          <TrainerProfileReviewsTabPanel trainerProfileId={trainerProfileId} />
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
