export type PrototypeRef = {
  screenId: string;
  note?: string;
};

export const PROTOTYPE_REFS: Record<string, PrototypeRef> = {
  tokens: { screenId: "global", note: "Warm Forest token canon" },
  typography: { screenId: "landing", note: "Hero + section titles" },
  buttons: { screenId: "c.book", note: "Primary CTA in booking wizard" },
  links: { screenId: "c.home", note: "Section view-all links" },
  cards: { screenId: "c.bookings", note: "Compact interactive list items" },
  forms: { screenId: "c.book", note: "Booking wizard + payment fields" },
  toasts: { screenId: "mixed", note: "Post-mutation feedback — Sonner" },
  modals: { screenId: "c.catalog", note: "Filters sheet + confirm dialogs" },
  media: { screenId: "c.catalog", note: "RatingStars, chips, PhotoSlot, Avatar, Tabs pill" },
  patterns: { screenId: "mixed", note: "Composed blocks from styleguide" },
  "catalog-patterns": { screenId: "c.book", note: "SectionHeader, ChoiceCard, SchedulePicker, SummaryCard" },
  marketing: {
    screenId: "/",
    note: "Pulse Landing Page standalone — P16 marketing patterns",
  },
  "pattern-cta": { screenId: "c.book" },
  "pattern-kpi": { screenId: "t.home" },
  "pattern-booking": { screenId: "c.bookings" },
  "pattern-badges": { screenId: "a.trainers" },
  "pattern-section-header": { screenId: "c.home" },
  "pattern-empty": { screenId: "c.bookings", note: "Empty list state" },
};

export function getPrototypeRef(sectionId: string): PrototypeRef | undefined {
  return PROTOTYPE_REFS[sectionId];
}
