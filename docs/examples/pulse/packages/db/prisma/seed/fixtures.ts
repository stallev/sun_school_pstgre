export const BCRYPT_COST = 12;

/** Stable placeholder URLs for dev seed — plain `<img>` / Avatar, not Vercel Blob. */
export const SEED_PHOTO_URLS = {
  anna: "https://picsum.photos/seed/pulse-trainer-anna/400/400",
  maria: "https://picsum.photos/seed/pulse-trainer-maria/400/400",
  elena: "https://picsum.photos/seed/pulse-trainer-elena/400/400",
  clientAlex: "https://picsum.photos/seed/pulse-client-alex/400/400",
  clientSofia: "https://picsum.photos/seed/pulse-client-sofia/400/400",
} as const;

export const FIXTURE_USERS = {
  admin: {
    email: "admin@pulse.dev",
    password: "admin123",
    fullName: "Pulse Admin",
    role: "admin" as const,
    avatarUrl: null,
  },
  client: {
    email: "client@pulse.dev",
    password: "client123",
    fullName: "Alex Client",
    role: "client" as const,
    avatarUrl: SEED_PHOTO_URLS.clientAlex,
  },
  clientSofia: {
    email: "sofia@pulse.dev",
    password: "client123",
    fullName: "Sofia Client",
    role: "client" as const,
    avatarUrl: SEED_PHOTO_URLS.clientSofia,
  },
  clientMax: {
    email: "max@pulse.dev",
    password: "client123",
    fullName: "Max Client",
    role: "client" as const,
    avatarUrl: null,
  },
  clientNina: {
    email: "nina@pulse.dev",
    password: "client123",
    fullName: "Nina Client",
    role: "client" as const,
    avatarUrl: null,
  },
  anna: {
    email: "anna@pulse.dev",
    password: "trainer123",
    fullName: "Anna Cardio",
    role: "trainer" as const,
    avatarUrl: SEED_PHOTO_URLS.anna,
  },
  dmitry: {
    email: "dmitry@pulse.dev",
    password: "trainer123",
    fullName: "Dmitry Strength",
    role: "trainer" as const,
    avatarUrl: null,
  },
  maria: {
    email: "maria@pulse.dev",
    password: "trainer123",
    fullName: "Maria Pilates",
    role: "trainer" as const,
    avatarUrl: SEED_PHOTO_URLS.maria,
  },
  ivan: {
    email: "ivan@pulse.dev",
    password: "trainer123",
    fullName: "Ivan CrossFit",
    role: "trainer" as const,
    avatarUrl: null,
  },
  elena: {
    email: "elena@pulse.dev",
    password: "trainer123",
    fullName: "Elena Stretch",
    role: "trainer" as const,
    avatarUrl: SEED_PHOTO_URLS.elena,
  },
  sergey: {
    email: "sergey@pulse.dev",
    password: "trainer123",
    fullName: "Sergey Power",
    role: "trainer" as const,
    avatarUrl: null,
  },
  pending: {
    email: "pending@pulse.dev",
    password: "trainer123",
    fullName: "Pending Trainer",
    role: "trainer" as const,
    avatarUrl: null,
  },
} as const;

export const SPECIALIZATIONS = [
  { slug: "cardio", name: "Cardio" },
  { slug: "pilates", name: "Pilates" },
  { slug: "strength", name: "Strength Training" },
  { slug: "hiit", name: "HIIT" },
  { slug: "stretching", name: "Stretching" },
] as const;

/** Deterministic seed IDs for idempotent re-runs */
export const SEED_IDS = {
  pendingFileAsset: "11111111-1111-4111-8111-111111111101",
  pendingVerificationDoc: "11111111-1111-4111-8111-111111111102",
  bookingPending: "22222222-2222-4222-8222-222222222201",
  bookingConfirmed: "22222222-2222-4222-8222-222222222202",
  bookingCompleted: "22222222-2222-4222-8222-222222222203",
  bookingCancelled: "22222222-2222-4222-8222-222222222204",
  /** Anna — completed, no review (primary P09 smoke) */
  bookingCompletedNoReview: "22222222-2222-4222-8222-222222222205",
  /** Dmitry — completed, no review (repeat submit smoke) */
  bookingCompletedNoReviewDmitry: "22222222-2222-4222-8222-222222222206",
  /** Elena — completed, no review (repeat submit smoke) */
  bookingCompletedNoReviewElena: "22222222-2222-4222-8222-222222222207",
  /** Ivan — completed, with review (review-submitted UI smoke) */
  bookingCompletedReviewedIvan: "22222222-2222-4222-8222-222222222208",
  reviewMaria: "33333333-3333-4333-8333-333333333301",
  reviewIvan: "33333333-3333-4333-8333-333333333302",
  complaintOpen: "44444444-4444-4444-8444-444444444401",
  refundPending: "55555555-5555-4555-8555-555555555501",
} as const;
