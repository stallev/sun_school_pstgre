import { TrainerClientDetailPanel } from "@/components/trainer/TrainerClientDetailPanel";
import { getTrainerClientDetail } from "@/data/trainer/get-trainer-client-detail.server";

type TrainerClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TrainerClientDetailPage({
  params,
}: TrainerClientDetailPageProps) {
  const { id } = await params;
  const detail = await getTrainerClientDetail(id);

  return <TrainerClientDetailPanel detail={detail} />;
}
