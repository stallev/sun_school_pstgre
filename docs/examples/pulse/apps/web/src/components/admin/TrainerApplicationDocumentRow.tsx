import { CheckCircleIcon, CircleDashedIcon, DownloadIcon } from "lucide-react";

import { CustomLink } from "@/components/ui/CustomLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getMessages } from "@/lib/messages/server";


export type TrainerApplicationDocumentRowProps = {
  id: string;
  title: string;
  fileAssetId: string | null;
  uploadStatus: string | null;
};

export async function TrainerApplicationDocumentRow({  title,
  fileAssetId,
  uploadStatus,
}: TrainerApplicationDocumentRowProps) {
  const messages = await getMessages();

  const isReady = Boolean(fileAssetId && uploadStatus === "ready");
  const downloadAria = messages.admin.moderation.downloadAria.replace(
    "{title}",
    title,
  );

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {isReady ? (
          <CheckCircleIcon
            className="size-4 shrink-0 text-[hsl(var(--color-success))]"
            aria-hidden
          />
        ) : (
          <CircleDashedIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
        <span className="truncate text-sm">{title}</span>
      </div>

      {isReady && fileAssetId ? (
        <CustomLink
          as="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          href={`/api/files/${fileAssetId}`}
          aria-label={downloadAria}
        >
          <DownloadIcon aria-hidden className="size-4" />
          {messages.admin.moderation.download}
        </CustomLink>
      ) : (
        <StatusBadge status="pending">
          {messages.admin.moderation.statusPendingReview}
        </StatusBadge>
      )}
    </li>
  );
}
