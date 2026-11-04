import { CustomLink } from "@/components/ui/custom-link";
import type { AdminMessages } from "@/lib/messages/admin-messages";

type ShowMoreProps = {
  href: string;
  remainingCount: number;
  messages: AdminMessages;
};

export const ShowMore = ({ href, remainingCount, messages }: ShowMoreProps) => {
  if (remainingCount <= 0) return null;

  return (
    <CustomLink href={href} className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium text-ink-2 hover:bg-paper hover:text-ink">
      {messages.people.showMore.replace("{count}", String(remainingCount))}
    </CustomLink>
  );
};
