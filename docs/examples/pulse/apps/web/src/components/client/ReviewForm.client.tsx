"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ContentText } from "@/components/atoms";
import { submitReviewAction } from "@/actions/client/publish-review";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RatingStars } from "@/components/ui/RatingStars";
import { Textarea } from "@/components/ui/textarea";
import type { MutationResult } from "@pulse/domain";

import { useMessages } from "@/components/i18n/LocaleProvider.client";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

const BODY_MAX = 500;

export type ReviewFormProps = {
  bookingId: string;
};

export function ReviewForm({ bookingId }: ReviewFormProps) {
  const messages = useMessages();
  const [rating, setRating] = useState(0);
  const [bodyLength, setBodyLength] = useState(0);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<
    MutationResult<{ reviewId: string; bookingId: string }> | null,
    FormData
  >(submitReviewAction, null);
  const lastHandledState = useRef<typeof state>(null);

  useEffect(() => {
    if (!state || state === lastHandledState.current || state.ok) {
      return;
    }

    lastHandledState.current = state;

    toast.error(state.message, {
      duration: PRODUCT_TOAST_DURATION_MS,
    });
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (rating < 1) {
      event.preventDefault();
      setRatingError(messages.review.ratingRequired);
      return;
    }

    setRatingError(null);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} aria-busy={pending} className="space-y-6">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating > 0 ? String(rating) : ""} />

      <Field data-invalid={Boolean(ratingError)}>
        <FieldLabel>{messages.review.ratingLabel}</FieldLabel>
        <RatingStars
          interactive
          value={rating}
          size="lg"
          onChange={(value) => {
            setRating(value);
            setRatingError(null);
          }}
          aria-label={messages.review.ratingLabel}
        />
        {ratingError ? <FieldError>{ratingError}</FieldError> : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="review-body">{messages.review.bodyLabel}</FieldLabel>
        <Textarea
          id="review-body"
          name="body"
          required
          minLength={20}
          maxLength={BODY_MAX}
          rows={5}
          disabled={pending}
          placeholder={messages.review.bodyPlaceholder}
          onChange={(event) => setBodyLength(event.target.value.length)}
        />
        <ContentText
          variant="mutedMicro"
          as="p"
          className="mt-1 text-right font-mono"
        >
          {messages.review.charCount
            .replace("{count}", String(bodyLength))
            .replace("{max}", String(BODY_MAX))}
        </ContentText>
      </Field>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
          {pending ? messages.review.submitting : messages.review.submit}
        </Button>
        <ContentText variant="mutedMicro" as="p" className="text-center">
          {messages.review.disclaimer}
        </ContentText>
      </div>
    </form>
  );
}
