import { TrainerServicesList } from "@/components/trainer/TrainerServicesList.client";
import { getTrainerServicesForEdit } from "@/data/trainer/get-trainer-services-for-edit.server";

export async function TrainerServicesSection() {
  const { services } = await getTrainerServicesForEdit();

  return <TrainerServicesList initialServices={services} />;
}
