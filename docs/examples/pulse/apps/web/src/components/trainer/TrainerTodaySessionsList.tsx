import Link from "next/link";

import { ContentText, SectionTitle } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import type { TrainerDashboardSession } from "@/data/trainer/get-trainer-dashboard.server";
import { getMessages } from "@/lib/messages/server";


export type TrainerTodaySessionsListProps = {
  sessions: TrainerDashboardSession[];
};

export async function TrainerTodaySessionsList({  sessions,
}: TrainerTodaySessionsListProps) {
  const messages = await getMessages();

  return (
    <section className="space-y-3">
      <SectionTitle>{messages.trainer.dashboardOps.todayTitle}</SectionTitle>
      {sessions.length === 0 ? (
        <PulseCard className="space-y-3 p-4">
          <ContentText variant="muted" as="p">
            {messages.trainer.dashboardOps.todayEmpty}
          </ContentText>
          <Button asChild variant="secondary" size="sm">
            <Link href="/trainer/schedule">
              {messages.trainer.dashboardOps.scheduleCta}
            </Link>
          </Button>
        </PulseCard>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <PulseCard key={session.id} className="p-4">
              <KeyValueRow label={session.startsAtLabel} value={session.clientName} />
              <ContentText variant="muted" as="p" className="mt-1 text-sm">
                {session.serviceName}
              </ContentText>
            </PulseCard>
          ))}
        </div>
      )}
    </section>
  );
}
