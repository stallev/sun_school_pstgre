import { Suspense } from "react";

import { TrainerScheduleEditorSection } from "@/components/trainer/schedule/TrainerScheduleEditor.server";

import TrainerScheduleLoading from "./loading";

export default function TrainerSchedulePage() {
  return (
    <Suspense fallback={<TrainerScheduleLoading />}>
      <TrainerScheduleEditorSection />
    </Suspense>
  );
}
