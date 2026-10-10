import { ContentText } from "@/components/atoms";
import { RatingStars } from "@/components/ui/RatingStars";
import { cn } from "@/lib/utils";

export type TestimonialCardProps = {
  quote: React.ReactNode;
  author: string;
  meta?: React.ReactNode;
  rating?: number;
  avatarColor?: "primary" | "secondary" | "primaryLight";
  className?: string;
};

const AVATAR_TONE_CLASSES = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  primaryLight: "bg-[hsl(var(--color-primary-light))] text-primary-foreground",
} as const;

export function TestimonialCard({
  quote,
  author,
  meta,
  rating = 5,
  avatarColor = "primary",
  className,
}: TestimonialCardProps) {
  const initial = author.trim()[0]?.toUpperCase() ?? "?";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[22px] border border-foreground/5 bg-card p-9 shadow-sm",
        className,
      )}
    >
      <p
        aria-hidden
        className="mb-4 font-heading text-[72px] leading-[0.65] text-muted-foreground/35"
      >
        &ldquo;
      </p>
      <div className="mb-3.5">
        <RatingStars value={rating} size="sm" aria-label={`${rating} of 5 stars`} />
      </div>
      <ContentText variant="body" as="p" className="mb-7 flex-1 leading-relaxed">
        {quote}
      </ContentText>
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold",
            AVATAR_TONE_CLASSES[avatarColor],
          )}
        >
          {initial}
        </div>
        <div className="min-w-0 text-left">
          <ContentText variant="smallEmphasis" as="p">
            {author}
          </ContentText>
          {meta ? (
            <ContentText variant="muted" as="p" className="mt-0.5">
              {meta}
            </ContentText>
          ) : null}
        </div>
      </div>
    </article>
  );
}
