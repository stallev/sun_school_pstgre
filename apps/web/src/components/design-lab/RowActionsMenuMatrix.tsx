"use client";

import { RowActionsMenu, RowActionsMenuItem } from "@/components/ui/row-actions-menu";
import { rowActionsMenuLabSection } from "@/lib/design-lab/sections";
import { MatrixCell } from "./MatrixCell";

export const RowActionsMenuMatrix = () => (
  <div className="grid gap-4 md:grid-cols-2">
    <MatrixCell label="Default">
      <RowActionsMenu triggerLabel="More actions">
        <RowActionsMenuItem>Edit</RowActionsMenuItem>
        <RowActionsMenuItem>Transfer</RowActionsMenuItem>
      </RowActionsMenu>
    </MatrixCell>
    <MatrixCell label="Destructive items">
      <RowActionsMenu triggerLabel="More actions">
        <RowActionsMenuItem destructive>Remove from group</RowActionsMenuItem>
        <RowActionsMenuItem destructive>Request deletion…</RowActionsMenuItem>
      </RowActionsMenu>
    </MatrixCell>
    <MatrixCell label={`Catalog (${rowActionsMenuLabSection.id})`}>
      <p className="text-sm text-muted-foreground">
        Import from <code className="text-ink">@/components/ui/row-actions-menu</code> on product screens.
      </p>
    </MatrixCell>
  </div>
);
