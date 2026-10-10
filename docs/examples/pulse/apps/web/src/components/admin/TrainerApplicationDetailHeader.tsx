import { ChevronLeftIcon } from "lucide-react";

import { CustomLink } from "@/components/ui/CustomLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMessages } from "@/lib/messages/server";


export async function TrainerApplicationDetailHeader() {
  const messages = await getMessages();
  return (
    <div className="space-y-4">
      <CustomLink
        href="/admin/trainers"
        as="button"
        variant="ghost"
        size="sm"
        className="min-h-11 -ml-2"
      >
        <ChevronLeftIcon aria-hidden className="size-4" />
        {messages.shell.back}
      </CustomLink>
      <PageHeader title={messages.admin.moderation.applicationDetail} />
    </div>
  );
}
