"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { ContentText } from "@/components/atoms";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";

export type TrainerClientNotesFieldProps = {
  clientId: string;
  initialNotes: string;
};

export function TrainerClientNotesField({  clientId,
  initialNotes,
}: TrainerClientNotesFieldProps) {
  const messages = useMessages();

  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function saveNotes(nextNotes: string) {
    startTransition(async () => {
      setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_PRIMARY);

      try {
        const response = await resilientPostFetch(
          `/api/trainer/clients/${clientId}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: nextNotes }),
          },
        );
        const result = (await response.json()) as { ok: boolean; message?: string };

        if (!response.ok || !result.ok) {
          toast.error(result.message ?? messages.trainer.clients.errors.notesSave, {
            duration: PRODUCT_TOAST_DURATION_MS,
          });
        }
      } catch {
        toast.error(messages.trainer.clients.errors.notesSave, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
      }
    });
  }

  function handleChange(value: string) {
    setNotes(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      saveNotes(value);
    }, 1000);
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(event) => handleChange(event.target.value)}
        rows={5}
        aria-busy={isPending}
        disabled={isPending}
        placeholder={messages.trainer.clients.privateNotesHint}
      />
      <ContentText variant="hint" as="p">
        {isPending
          ? messages.trainer.clients.notesSaving
          : messages.trainer.clients.notesSaved}
      </ContentText>
    </div>
  );
}
