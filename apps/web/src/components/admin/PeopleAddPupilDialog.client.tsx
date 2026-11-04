"use client";

import { useState } from "react";
import { PupilCardForm } from "@/components/admin/PupilCardForm";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";

type PeopleAddPupilDialogProps = {
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  formError: string;
};

export const PeopleAddPupilDialog = ({
  dictionaries,
  uiLocale,
  formError,
}: PeopleAddPupilDialogProps) => {
  const messages = useAdminMessages();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" className="min-h-11" />}>
        {messages.people.addPupilAction}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{messages.people.createTitle}</DialogTitle>
        </DialogHeader>
        <PupilCardForm
          mode="create"
          dictionaries={dictionaries}
          uiLocale={uiLocale}
          formError={formError}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
