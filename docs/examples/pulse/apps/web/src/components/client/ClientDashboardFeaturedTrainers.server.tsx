import { TrainerCard } from "@/components/catalog/TrainerCard";
import { ClientDashboardFeaturedTrainersEmpty } from "@/components/client/ClientDashboardFeaturedTrainersEmpty";
import { ClientDashboardFeaturedTrainersError } from "@/components/client/ClientDashboardFeaturedTrainersError.client";
import { SectionHeader } from "@/components/ui/SectionHeader";

import { getFeaturedTrainers } from "@/data/catalog/get-featured-trainers.server";
import { getMessages } from "@/lib/messages/server";


const DASHBOARD_FEATURED_TRAINERS_LIMIT = 6;

export async function ClientDashboardFeaturedTrainers() {
  const messages = await getMessages();
  let trainers;

  try {
    trainers = await getFeaturedTrainers(DASHBOARD_FEATURED_TRAINERS_LIMIT);
  } catch {
    return <ClientDashboardFeaturedTrainersError />;
  }

  if (trainers.length === 0) {
    return <ClientDashboardFeaturedTrainersEmpty />;
  }

  return (
    <section>
      <SectionHeader
        title={messages.dashboard.client.topTrainersTitle}
        actionHref="/trainers"
        actionLabel={messages.dashboard.client.topTrainersAll}
      />
      <div className="grid min-w-0 grid-cols-1 gap-2.5 lg:grid-cols-2">
        {trainers.map((trainer, index) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
            gridLayout
            imagePriority={index < 2}
          />
        ))}
      </div>
    </section>
  );
}
