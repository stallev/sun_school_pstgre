import { ChevronRightIcon } from "lucide-react";
import { CustomLink } from "@/components/ui/custom-link";
import type { FamilyListRow as FamilyListRowData } from "@/data/families/load-families-admin.server";
import type { FamilyAdminMessages } from "@/lib/messages/pick-family-admin-messages.server";

type FamilyListRowProps = {
  row: FamilyListRowData;
  messages: FamilyAdminMessages;
};

export const FamilyListRow = ({ row, messages }: FamilyListRowProps) => (
  <li>
    <CustomLink
      href={`/family?id=${row.familyId}`}
      className="grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition-colors hover:bg-paper/70 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1fr)_1.5rem] sm:items-center sm:gap-6"
    >
      <span className="font-display text-lg font-medium text-ink">{row.name}</span>
      <span className="min-w-0 text-sm text-ink-2">
        {row.adults.length === 0 ? (
          <span className="text-warn">{messages.noAdults}</span>
        ) : (
          row.adults.map((adult) => (
            <span key={`${adult.displayName}-${adult.relation}`} className="block truncate">
              {adult.displayName} · {messages.relationLabels[adult.relation] ?? adult.relation}{" "}
              {adult.hasAccount ? (
                <span className="text-ok">· {messages.listAdultSignedIn}</span>
              ) : (
                <span className="text-muted">· {messages.listAdultNoAccount}</span>
              )}
            </span>
          ))
        )}
      </span>
      <span className="min-w-0 text-sm">
        {row.children.length === 0 ? (
          <span className="text-warn">{messages.noChildren}</span>
        ) : (
          row.children.map((child) => (
            <span key={child.displayName} className="block truncate">
              {child.displayName}{" "}
              <span className="text-muted">
                · {child.groupName ?? "—"}
                {child.lacksConsent ? ` · ${messages.listNoConsent}` : ""}
              </span>
            </span>
          ))
        )}
      </span>
      <ChevronRightIcon className="hidden size-5 text-muted sm:block" aria-hidden />
    </CustomLink>
  </li>
);
