/** Decorative monogram (ВШ) — not locale-specific copy; aria-hidden in the shell. */
const BRAND_MONOGRAM = "\u0412\u0428";

type BrandMarkProps = {
  /** Optional brand name beside the monogram (e.g. shell header). */
  brandName?: string;
};

export const BrandMark = ({ brandName }: BrandMarkProps) => (
  <span className="inline-flex items-center gap-3">
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-cobalt-ink font-body text-sm font-bold text-primary-foreground"
      aria-hidden
    >
      {BRAND_MONOGRAM}
    </span>
    {brandName ? <span className="font-display text-lg font-medium text-ink">{brandName}</span> : null}
  </span>
);
