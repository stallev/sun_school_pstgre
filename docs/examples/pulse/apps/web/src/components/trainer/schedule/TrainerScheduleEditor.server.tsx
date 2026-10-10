import { Heading } from "@/components/atoms";
import { TrainerScheduleEditor } from "@/components/trainer/schedule/TrainerScheduleEditor.client";
import { getTrainerScheduleForEdit } from "@/data/trainer/get-trainer-schedule-for-edit.server";
import { getMessages } from "@/lib/messages/server";


export async function TrainerScheduleEditorSection() {
  const messages = await getMessages();
  const schedule = await getTrainerScheduleForEdit();

  return (
    <>
      <Heading as="h1" visualLevel="h3">
        {messages.trainer.schedule.title}
      </Heading>
      <TrainerScheduleEditor initialSchedule={schedule} />
    </>
  );
}
