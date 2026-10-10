import { UsersIcon } from "lucide-react";

import { Heading } from "@/components/atoms";
import { TrainerClientsList } from "@/components/trainer/TrainerClientsList.client";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listTrainerClients } from "@/data/trainer/list-trainer-clients.server";
import { getMessages } from "@/lib/messages/server";


export default async function TrainerClientsPage() {
  const messages = await getMessages();
  const clients = await listTrainerClients();

  return (
    <>
      <Heading as="h1" visualLevel="h3">
        {messages.trainer.clients.title}
      </Heading>
      {clients.length === 0 ? (
        <Empty className="mt-6 border-border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{messages.trainer.clients.emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {messages.trainer.clients.emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      ) : (
        <div className="mt-6">
          <TrainerClientsList clients={clients} />
        </div>
      )}
    </>
  );
}
