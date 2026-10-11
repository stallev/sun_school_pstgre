"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { NavDrawer } from "@/components/patterns/NavDrawer";
import { CustomLink } from "@/components/ui/custom-link";
import { LAB_SELECT_OPTIONS, LAB_TEXT } from "@/lib/design-lab/fixtures";
import { MatrixCell } from "./MatrixCell";

export const OverlayMatrix = () => (
  <div className="grid gap-3 md:grid-cols-2">
    <MatrixCell label="Dialog (ConfirmDialog)">
      <ConfirmDialog
        trigger={<Button variant="outline">{LAB_TEXT.dialogTitle}</Button>}
        title={LAB_TEXT.dialogTitle}
        description={LAB_TEXT.dialogBody}
        confirmLabel={LAB_TEXT.confirm}
        cancelLabel={LAB_TEXT.cancel}
        onConfirm={() => undefined}
        destructive
      />
    </MatrixCell>
    <MatrixCell label="Sheet (NavDrawer)">
      <NavDrawer
        trigger={<Button variant="outline">{LAB_TEXT.drawerTitle}</Button>}
        title={LAB_TEXT.drawerTitle}
        closeLabel={LAB_TEXT.close}
      >
        <CustomLink href="/design-system">{LAB_TEXT.drawerTitle}</CustomLink>
      </NavDrawer>
    </MatrixCell>
    <MatrixCell label="Disclosure">
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="ghost" />}>{LAB_TEXT.disclosureTitle}</CollapsibleTrigger>
        <CollapsibleContent>
          <p className="pt-2 text-base text-ink-2">{LAB_TEXT.disclosureBody}</p>
        </CollapsibleContent>
      </Collapsible>
    </MatrixCell>
    <MatrixCell label="Select">
      <Select defaultValue={LAB_SELECT_OPTIONS[0]}>
        <SelectTrigger aria-label={LAB_TEXT.fieldLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LAB_SELECT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </MatrixCell>
  </div>
);
