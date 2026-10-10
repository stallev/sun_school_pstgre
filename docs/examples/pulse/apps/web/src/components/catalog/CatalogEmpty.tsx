import Link from "next/link";
import { SearchXIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/lib/messages/server";


export async function CatalogEmpty() {
  const messages = await getMessages();
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{messages.catalog.empty.title}</EmptyTitle>
        <EmptyDescription>{messages.catalog.empty.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/trainers">{messages.catalog.empty.cta}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
