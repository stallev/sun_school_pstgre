export const platformFeaturesEn = {
  meta: {
    title: "Platform features — Pulse MVP",
    description:
      "Live client, trainer, and admin workflows in Pulse: catalog, booking, onboarding, moderation, i18n, and more — with demo paths to try the app.",
    keywords: [
      "Pulse features",
      "fitness marketplace",
      "trainer booking",
      "MVP functionality",
      "demo",
    ],
    ogImageAlt: "Pulse platform features — MVP overview",
  },
  nav: {
    link: "Platform features",
  },
  toc: {
    ariaLabel: "Page sections",
    label: "On this page",
  },
  hero: {
    eyebrow: "MVP feature overview",
    title: "Everything live",
    titleAccent: "in Pulse today",
    subcopy:
      "Real routes, real data flows, and production-grade UX — not a static prototype. Explore what each role can do right now.",
    kpis: [
      { value: "3", label: "User roles" },
      { value: "50+", label: "Routes" },
      { value: "EN/RU", label: "UI locales" },
      { value: "Live", label: "Booking & moderation" },
    ],
  },
  shared: {
    id: "shared",
    title: "Shared platform",
    intro: "Cross-cutting capabilities available across the application.",
    items: [
      {
        title: "Authentication",
        description:
          "Email + password sign-in and registration. JWT sessions with role in token (client, trainer, admin). Protected routes via proxy.",
        href: "/auth/login",
        linkLabel: "Sign in",
        status: "live",
      },
      {
        title: "Global UI shell",
        description:
          "Responsive top bar, bottom navigation on mobile, sidebar on desktop. Role-aware navigation for authenticated users.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Internationalization",
        description:
          "English and Russian UI with cookie-first locale resolution, switcher in header and profile, localized dates and copy.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Mutation feedback",
        description:
          "Sonner toasts after create/update/delete, pending states on submits, optimistic toggles where appropriate.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "File uploads",
        description:
          "Presigned S3 uploads for profile photos, certificates, and verification documents during trainer onboarding.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Design system",
        description:
          "Warm Forest tokens and typography atoms across product UI. Dev-only component catalog (/design-system) for local development.",
        href: null,
        linkLabel: null,
        status: "live",
      },
    ],
  },
  client: {
    id: "client",
    title: "Client",
    intro: "Discovery, booking, and post-session flows for people looking for trainers.",
    items: [
      {
        title: "Dashboard",
        description: "Home with greeting, next session, search, categories, and featured trainers.",
        href: "/client/dashboard",
        linkLabel: "Open dashboard",
        status: "live",
      },
      {
        title: "Trainer catalog",
        description: "Browse trainers with specialty, price, and rating filters, sort, pagination, and search.",
        href: "/trainers",
        linkLabel: "Browse catalog",
        status: "live",
      },
      {
        title: "Trainer profile",
        description: "Public profile with about, services, schedule preview, reviews, and book CTA.",
        href: "/trainers",
        linkLabel: "View trainers",
        status: "live",
      },
      {
        title: "Booking wizard",
        description: "Three steps: pick service, choose time slot, confirm. Creates a pending booking without online payment.",
        href: "/trainers",
        linkLabel: "Start from catalog",
        status: "live",
      },
      {
        title: "My bookings",
        description: "Upcoming, past, and cancelled sessions with status badges and quick actions.",
        href: "/client/bookings",
        linkLabel: "View bookings",
        status: "live",
      },
      {
        title: "Booking detail",
        description: "Session summary, trainer info, cancel action, and links to complaint or refund when eligible.",
        href: "/client/bookings",
        linkLabel: "View bookings",
        status: "live",
      },
      {
        title: "Post-session review",
        description: "Rate and review a trainer after a completed session.",
        href: "/client/bookings",
        linkLabel: "From completed booking",
        status: "live",
      },
      {
        title: "Complaints & refunds",
        description: "File a complaint or request a refund from an eligible booking detail screen.",
        href: "/client/bookings",
        linkLabel: "From booking detail",
        status: "live",
      },
      {
        title: "Profile & language",
        description: "Account settings and explicit EN/RU language preference.",
        href: "/client/profile",
        linkLabel: "Open profile",
        status: "live",
      },
    ],
  },
  trainer: {
    id: "trainer",
    title: "Trainer",
    intro: "Onboarding, schedule, services, and client management for fitness professionals.",
    items: [
      {
        title: "Registration & onboarding",
        description:
          "Multi-step wizard: credentials, personal info, professional details, certificates upload, services, preview and submit.",
        href: "/auth/register/trainer",
        linkLabel: "Register as trainer",
        status: "live",
      },
      {
        title: "Dashboard",
        description: "Today's sessions, KPIs, recent reviews, and quick links to schedule and services.",
        href: "/trainer/dashboard",
        linkLabel: "Open dashboard",
        status: "live",
      },
      {
        title: "Public profile editing",
        description: "Update bio, photo, specialties, and language preference. Live listing only after admin approval.",
        href: "/trainer/profile",
        linkLabel: "Edit profile",
        status: "live",
      },
      {
        title: "Services",
        description: "Create, edit, delete services with pricing, duration, and active/hidden toggle.",
        href: "/trainer/services",
        linkLabel: "Manage services",
        status: "live",
      },
      {
        title: "Weekly schedule",
        description: "Recurring weekly availability with trainer timezone as the source of truth for slots.",
        href: "/trainer/schedule",
        linkLabel: "Open schedule",
        status: "live",
      },
      {
        title: "Schedule exceptions",
        description: "Block specific dates or override hours without changing the base weekly template.",
        href: "/trainer/schedule",
        linkLabel: "Open schedule",
        status: "live",
      },
      {
        title: "Clients",
        description: "List of clients with booking history and private notes per client.",
        href: "/trainer/clients",
        linkLabel: "View clients",
        status: "live",
      },
      {
        title: "Complete session",
        description:
          "For confirmed bookings, mark the session completed — the client then gets an in-app review prompt.",
        href: "/trainer/clients",
        linkLabel: "From client list",
        status: "live",
      },
      {
        title: "Income",
        description:
          "Session history and earnings summary from completed bookings. Stripe payouts are not connected on MVP.",
        href: "/trainer/income",
        linkLabel: "View income",
        status: "live",
      },
    ],
  },
  admin: {
    id: "admin",
    title: "Admin",
    intro: "Moderation, verification, and platform operations.",
    items: [
      {
        title: "Dashboard",
        description: "KPI grid, signups, open queues, GMV summary, and needs-attention highlights.",
        href: "/admin/dashboard",
        linkLabel: "Open dashboard",
        status: "live",
      },
      {
        title: "Trainer verification",
        description: "Review pending applications, inspect documents, approve or reject with reason.",
        href: "/admin/trainers",
        linkLabel: "Trainer queue",
        status: "live",
      },
      {
        title: "Review moderation",
        description: "Hide or delete client reviews that violate platform rules.",
        href: "/admin/reviews",
        linkLabel: "Reviews queue",
        status: "live",
      },
      {
        title: "Complaint resolution",
        description:
          "Triage open complaints, view booking context, and close with a resolution and admin notes.",
        href: "/admin/complaints",
        linkLabel: "Complaints queue",
        status: "live",
      },
      {
        title: "Refund processing",
        description: "Manual refund queue — status updates in database without Stripe API on MVP.",
        href: "/admin/refunds",
        linkLabel: "Refunds queue",
        status: "live",
      },
    ],
  },
  demo: {
    id: "demo",
    title: "Demo paths",
    intro: "Suggested walkthroughs to evaluate the live application in a few minutes.",
    paths: [
      {
        title: "Guest discovery",
        steps: ["Open /trainers", "Apply filters and open a profile", "Click Book — sign in when prompted"],
        href: "/trainers",
        linkLabel: "Start browsing",
      },
      {
        title: "Client booking",
        steps: [
          "Sign in as client@pulse.dev",
          "Book a session via wizard",
          "Open /client/bookings/[id] for detail and actions",
        ],
        href: "/auth/login?demo=client",
        linkLabel: "Try as Client",
      },
      {
        title: "Admin moderation",
        steps: [
          "Sign in as admin@pulse.dev",
          "Open /admin/dashboard for KPIs",
          "Review pending trainer at /admin/trainers",
        ],
        href: "/auth/login?demo=admin",
        linkLabel: "Try as Admin",
      },
    ],
    credentialsNote:
      "Credentials are pre-filled on the sign-in page.",
  },
  boundaries: {
    id: "boundaries",
    title: "MVP boundaries",
    intro: "Features outside the current MVP release.",
    plannedNote:
      "Stripe (online checkout and trainer payouts) and Daily.co (live video sessions) are on the product roadmap and will be integrated in upcoming releases. Related database fields are already prepared.",
    tableHeaders: {
      feature: "Feature",
      status: "Status",
    },
    items: [
      {
        feature: "Online payment (Stripe Connect)",
        status: "Planned — checkout and payouts via Stripe Connect",
      },
      {
        feature: "Video sessions (Daily.co)",
        status: "Planned — in-session video via Daily.co rooms",
      },
      { feature: "Transactional email", status: "Tables ready — no sends on MVP" },
      { feature: "OAuth (Google)", status: "Post-MVP" },
      { feature: "Password reset via email", status: "Post-MVP" },
    ],
    roadmapLink: "See architecture roadmap",
    roadmapHref: "/how-it-was-built#roadmap",
  },
  statusLabels: {
    live: "Live",
    stub: "Stub",
  },
  cta: {
    title: "Want to know how it was built?",
    description: "Timeline, architecture, AI-first methodology, and post-MVP roadmap — on the case study page.",
    primary: "How it was built",
    primaryHref: "/how-it-was-built",
    secondary: "Browse trainers",
    secondaryHref: "/trainers",
  },
} as const;
