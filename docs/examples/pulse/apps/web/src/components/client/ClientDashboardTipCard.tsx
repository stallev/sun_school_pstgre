import { LightbulbIcon } from "lucide-react";

import { ContentText, SectionTitle } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";

import { getMessages } from "@/lib/messages/server";


export async function ClientDashboardTipCard() {
  const messages = await getMessages();
  return (
    <aside
      aria-labelledby="client-dashboard-tip-title"
      className="w-full"
    >
      <PulseCard
        variant="base"
        state="warning"
        className="flex items-start gap-3.5 p-4 md:gap-4 md:p-5"
      >
        <span
          aria-hidden
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--gold-light)]/35 text-[hsl(var(--color-warning))] ring-1 ring-[color:var(--gold-light)]/50"
        >
          <LightbulbIcon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 space-y-1.5">
          <SectionTitle
            as="h2"
            id="client-dashboard-tip-title"
            className="mx-0 max-w-none text-left text-base leading-snug"
          >
            {messages.dashboard.client.tipTitle}
          </SectionTitle>
          <ContentText variant="muted" as="p" className="leading-relaxed">
            {messages.dashboard.client.tipBody}
          </ContentText>
        </div>
      </PulseCard>
    </aside>
  );
}
