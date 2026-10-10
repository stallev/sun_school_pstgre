import { redirect } from "next/navigation";

type BookTrainerConfirmPageProps = {
  params: Promise<{ trainerId: string }>;
  searchParams: Promise<{ serviceId?: string }>;
};

export default async function BookTrainerConfirmPage({
  params,
  searchParams,
}: BookTrainerConfirmPageProps) {
  const { trainerId } = await params;
  const query = await searchParams;
  const serviceQuery = query.serviceId ? `&serviceId=${query.serviceId}` : "";

  redirect(`/book/${trainerId}?step=3${serviceQuery}`);
}
