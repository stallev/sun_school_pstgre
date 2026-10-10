"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { ContentText } from "@/components/atoms";
import { createBookingAction } from "@/actions/client/create-booking";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  BOOKING_MUTATION_ERROR_CODES,
  type MutationResult,
} from "@pulse/domain";

import {
  formatBookingDateTime,
  formatBookingPrice,
} from "@/lib/booking/booking-wizard-utils";
import type { TrainerServiceItem } from "@/lib/trainer/trainer-profile";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { isIosSafari } from "@/lib/ui/is-ios-safari";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";

import type { Messages } from "@/lib/messages/types";

const MESSAGE_MAX = 500;

export type BookingWizardConfirmStepProps = {
  trainerProfileId: string;
  service: TrainerServiceItem;
  startsAtUtc: string;
  timezone: string;
  trainerName: string;
  onSlotUnavailable: () => void;
};

function mapBookingErrorMessage(code: string, messages: Messages): string {
  switch (code) {
    case BOOKING_MUTATION_ERROR_CODES.SLOT_UNAVAILABLE:
      return messages.booking.errors.slotUnavailable;
    case BOOKING_MUTATION_ERROR_CODES.SERVICE_INACTIVE:
      return messages.booking.errors.serviceInactive;
    case BOOKING_MUTATION_ERROR_CODES.SLOT_IN_PAST:
      return messages.booking.errors.slotInPast;
    default:
      return messages.booking.errors.generic;
  }
}

export function BookingWizardConfirmStep({  trainerProfileId,
  service,
  startsAtUtc,
  timezone,
  trainerName,
  onSlotUnavailable,
}: BookingWizardConfirmStepProps) {
  const messages = useMessages();
  const locale = useLocale();

  const router = useRouter();
  const [state, formAction, isActionPending] = useActionState(
    createBookingAction,
    null,
  );
  const [isFallbackPending, startFallbackTransition] = useTransition();
  const [messageLength, setMessageLength] = useState(0);
  const pending = isActionPending || isFallbackPending;

  useEffect(() => {
    if (!state || state.ok) {
      return;
    }

    toast.error(state.message ?? mapBookingErrorMessage(state.code, messages), {
      duration: PRODUCT_TOAST_DURATION_MS,
    });

    if (state.code === BOOKING_MUTATION_ERROR_CODES.SLOT_UNAVAILABLE) {
      onSlotUnavailable();
    }
  }, [onSlotUnavailable, state]);

  function submitViaApi(formData: FormData) {
    startFallbackTransition(async () => {
      setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_FALLBACK);

      try {
        const clientMessage = formData.get("clientMessage");
        const response = await resilientPostFetch("/api/client/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainerProfileId: String(formData.get("trainerProfileId")),
            trainerServiceId: String(formData.get("trainerServiceId")),
            startsAtUtc: String(formData.get("startsAtUtc")),
            clientMessage:
              typeof clientMessage === "string" && clientMessage.trim()
                ? clientMessage.trim()
                : undefined,
          }),
        });

        const result = (await response.json()) as MutationResult<{ id: string }>;

        if (!response.ok && !("ok" in result)) {
          toast.error(messages.booking.errors.generic, {
            duration: PRODUCT_TOAST_DURATION_MS,
          });
          return;
        }

        if (!result.ok) {
          toast.error(result.message ?? mapBookingErrorMessage(result.code, messages), {
            duration: PRODUCT_TOAST_DURATION_MS,
          });

          if (result.code === BOOKING_MUTATION_ERROR_CODES.SLOT_UNAVAILABLE) {
            onSlotUnavailable();
          }

          return;
        }

        router.push(`/client/bookings/${result.data.id}?booked=1`);
      } catch {
        toast.error(messages.booking.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isIosSafari()) {
      setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.SERVER_ACTION);
      return;
    }

    event.preventDefault();
    submitViaApi(new FormData(event.currentTarget));
  }

  return (
    <form
      action={isIosSafari() ? undefined : formAction}
      onSubmit={handleSubmit}
      aria-busy={pending}
      className="space-y-4"
    >
      <input type="hidden" name="trainerProfileId" value={trainerProfileId} />
      <input type="hidden" name="trainerServiceId" value={service.id} />
      <input type="hidden" name="startsAtUtc" value={startsAtUtc} />

      <SummaryCard
        title={messages.booking.wizard.summaryTitle}
        rows={[
          {
            label: messages.booking.detail.trainerLabel,
            value: trainerName,
          },
          {
            label: messages.booking.detail.serviceLabel,
            value: service.name,
          },
          {
            label: messages.booking.detail.timeLabel,
            value: formatBookingDateTime(startsAtUtc, timezone, locale),
          },
        ]}
        totals={[
          {
            label: messages.booking.detail.priceLabel,
            value: formatBookingPrice(service.priceCents, service.currency, locale),
          },
        ]}
        className="w-full"
      />

      <Field>
        <FieldLabel htmlFor="clientMessage">
          {messages.booking.wizard.messageLabel}
        </FieldLabel>
        <Textarea
          id="clientMessage"
          name="clientMessage"
          maxLength={MESSAGE_MAX}
          disabled={pending}
          placeholder={messages.booking.wizard.messagePlaceholder}
          rows={4}
          onChange={(event) => setMessageLength(event.target.value.length)}
        />
        <ContentText variant="mutedMicro" as="p" className="font-mono">
          {messages.booking.wizard.messageCounter
            .replace("{count}", String(messageLength))
            .replace("{max}", String(MESSAGE_MAX))}
        </ContentText>
      </Field>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <>
              <Loader2Icon aria-hidden className="size-4 animate-spin" />
              {messages.booking.wizard.submitting}
            </>
          ) : (
            messages.booking.wizard.confirm
          )}
        </Button>
      </div>
    </form>
  );
}
