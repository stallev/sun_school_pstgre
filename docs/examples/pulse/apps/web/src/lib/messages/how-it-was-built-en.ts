export const howItWasBuiltEn = {
  meta: {
    title: "How Pulse was built — full-stack case study",
    description:
      "Solo developer, ~26 hours from specification to deploy: AI-first methodology, monorepo architecture, and production-grade MVP for a fitness trainer marketplace.",
    keywords: [
      "case study",
      "Next.js",
      "full-stack",
      "AI-assisted development",
      "fitness marketplace",
      "Pulse",
      "TypeScript monorepo",
    ],
    ogImageAlt: "How Pulse was built — development case study",
  },
  nav: {
    link: "How it was built",
  },
  toc: {
    ariaLabel: "Page sections",
    label: "On this page",
  },
  hero: {
    eyebrow: "Development case study",
    title: "From specification",
    titleAccent: "to production in ~26 hours",
    subcopy:
      "Pulse is a full-stack fitness trainer marketplace — built solo with Cursor and Claude Code under explicit architecture contracts, not no-code generators.",
    kpis: [
      { value: "~26h", label: "Spec to deploy" },
      { value: "1", label: "Solo developer" },
      { value: "3", label: "User roles" },
      { value: "50+", label: "Routes" },
    ],
  },
  overview: {
    id: "overview",
    title: "Overview",
    paragraphs: [
      "Pulse connects clients with verified fitness trainers: discovery, booking, trainer onboarding, and admin moderation — a complete marketplace loop without payment on MVP.",
      "This page documents how the application was built: timeline, architecture, product scope, and extension points already prepared in the schema.",
      "The goal is to demonstrate that modern web applications can be delivered quickly while preserving engineering standards — typed domain layer, documented ADRs, accessibility, and bilingual UI.",
    ],
    highlights: [
      "Not built with Lovable, Replit, or similar no-code platforms",
      "AI tools accelerated implementation under written contracts and phase checklists",
      "Production deploy on Vercel with Neon PostgreSQL",
    ],
  },
  timeline: {
    id: "timeline",
    title: "Timeline",
    intro:
      "One focused sprint from product definition to a deployed, browsable application.",
    steps: [
      {
        phase: "Specification",
        detail:
          "PRD, user flows, database schema, ADRs, implementation contracts, and HTML prototype — AI-first methodology with a single source of truth per topic.",
      },
      {
        phase: "Design system",
        detail:
          "Warm Forest tokens, typography scale, and a Design Lab catalog at /design-system for reusable UI primitives.",
      },
      {
        phase: "Implementation",
        detail:
          "Monorepo scaffold (apps/web + packages/domain, policy, db), phased delivery P01–P14: auth, catalog, booking, trainer tools, admin moderation.",
      },
      {
        phase: "Quality & i18n",
        detail:
          "EN/RU locale, WCAG-oriented semantics, mutation pending UI, iOS Safari transport fallback, typecheck and lint gates.",
      },
      {
        phase: "Deploy",
        detail:
          "Vercel production build, environment configuration, seed data for demo roles (client, trainer, admin).",
      },
    ],
  },
  product: {
    id: "product",
    title: "Product scope",
    intro:
      "MVP covers client discovery and booking, trainer onboarding and schedule, and admin moderation — end-to-end marketplace loops without payment on MVP.",
    summaries: [
      "Client — catalog, booking wizard, bookings, reviews, complaints",
      "Trainer — onboarding, services, schedule, clients, session completion",
      "Admin — verification, review moderation, complaints, refunds",
    ],
    featuresLink: "See full feature breakdown",
    featuresHref: "/features",
    note:
      "Booking is confirmed without online payment — by design (ADR-005).",
  },
  architecture: {
    id: "architecture",
    title: "Architecture",
    intro:
      "Layered monorepo with strict boundaries — web app is a thin BFF, business rules live in packages.",
    layers: [
      {
        name: "apps/web",
        description:
          "Next.js 16.3.0 App Router — Server Components, Server Actions, Route Handlers, proxy.ts for auth.",
      },
      {
        name: "@pulse/domain",
        description:
          "Pure business rules, use-cases, Zod DTOs, mutation error codes — no Next.js or Prisma imports.",
      },
      {
        name: "@pulse/policy-server / policy-edge",
        description:
          "Object-level authorization with Prisma on server; JWT-only checks at the edge — no DB in proxy.",
      },
      {
        name: "@pulse/db",
        description: "Prisma v7 on Neon PostgreSQL 17 — canonical DDL, migrations, seed.",
      },
    ],
    decisions: [
      "Auth.js v5 Credentials + JWT sessions; role in token (client | trainer | admin)",
      "TrainerProfile.timezone — single source of truth for slots and display",
      "Booking state transitions only through documented domain use-cases",
      "File uploads via presigned S3 URLs (ADR-007)",
      "Cookie-first i18n (EN/RU) without /[lang]/ URL prefixes (ADR-009)",
    ],
  },
  methodology: {
    id: "methodology",
    title: "AI-first methodology",
    intro:
      "AI agents follow the same cycle as a disciplined engineering team — context before code.",
    cycle: [
      "Context — read AGENTS.md, phase description, contracts",
      "Phase — scoped deliverable with explicit in/out of scope",
      "Contract — API shapes, routes, invariants before implementation",
      "Tasks — checklist with verification steps",
      "Verification — typecheck, lint, manual flows, doc alignment",
    ],
    closing:
      "Cursor and Claude Code executed under this framework. Architecture decisions were made by the developer and documented in ADRs — AI accelerated typing and iteration, not replaced system design.",
  },
  roadmap: {
    id: "roadmap",
    title: "Built-in roadmap",
    intro:
      "Post-MVP features are deferred from the product surface but prepared in schema and documentation — no breaking migrations when they ship.",
    tableHeaders: {
      feature: "Feature",
      status: "Status",
    },
    items: [
      {
        feature: "Stripe Connect payments",
        status: "Nullable columns in schema; routes reserved",
      },
      {
        feature: "Daily.co video sessions",
        status: "Booking room fields + /sessions route placeholder",
      },
      {
        feature: "Transactional email (Resend)",
        status: "job_execution and delivery_log tables ready",
      },
      {
        feature: "OAuth (Google)",
        status: "ADR amendment path documented",
      },
      {
        feature: "Client wishlist",
        status: "Domain + schema ready; UI deferred",
      },
      {
        feature: "Background workers",
        status: "apps/workers planned; Vercel Cron for MVP-scale jobs",
      },
    ],
  },
  stack: {
    id: "stack",
    title: "Stack & standards",
    intro: "Pinned versions and explicit governance — not accidental dependencies.",
    rows: [
      { label: "Framework", value: "Next.js 16.3.0 App Router, React 19, TypeScript" },
      { label: "Hosting", value: "Vercel (serverless, preview deploys)" },
      { label: "Database", value: "Neon PostgreSQL 17 + Prisma v7" },
      { label: "Auth", value: "Auth.js v5 Credentials, JWT RBAC" },
      { label: "UI", value: "shadcn/ui, Tailwind CSS v4, Warm Forest design system" },
      { label: "Storage", value: "AWS S3 presigned uploads" },
      { label: "i18n", value: "EN / RU, cookie-first locale resolution" },
      { label: "UX", value: "Sonner toasts, pending states, WCAG 2.1 AA target" },
      { label: "Observability", value: "Sentry error tracking + performance tracing" },
    ],
    badges: [
      "Monorepo",
      "Domain-driven",
      "ADR governance",
      "AI-first docs",
      "Mobile-first shell",
      "Sentry",
    ],
  },
  observability: {
    id: "observability",
    title: "Error tracking",
    intro:
      "Production errors are captured with Sentry across browser, Node.js server, and Edge runtimes — with readable stack traces and release correlation on every Vercel deploy.",
    rows: [
      { label: "Platform", value: "Sentry (@sentry/nextjs) — project fitapp" },
      { label: "Runtimes", value: "Client, Server Components, Server Actions, Route Handlers, proxy.ts" },
      { label: "Source maps", value: "Uploaded on build via SENTRY_AUTH_TOKEN" },
      { label: "Ad-blocker bypass", value: "Tunnel route /monitoring" },
      { label: "Privacy", value: "sendDefaultPii: false — no email or passwords in events" },
      { label: "Environments", value: "localhost, preview, and production" },
    ],
    points: [
      "global-error.tsx reports fatal React render failures; route-level error.tsx keeps user-friendly retry UI",
      "submit_transport tag on mutations separates Server Actions from iOS Safari Route Handler fallback (Class B flows)",
      "Session Replay deferred — error monitoring and tracing only on MVP",
      "Structured server logging conventions remain in observability_plan.md for Vercel function logs",
    ],
  },
  developer: {
    id: "developer",
    title: "About the developer",
    name: "Alexander Levshenko",
    role: "Full-stack web developer",
    bio: "Alexander builds production web applications with React, Next.js, and TypeScript. He combines hands-on full-stack delivery with structured documentation and AI-assisted workflows — shipping complete products quickly without sacrificing architecture, accessibility, or maintainability.",
    links: {
      github: "GitHub",
      linkedin: "LinkedIn",
      email: "Email",
    },
    githubUrl: "https://github.com/stallev",
    linkedinUrl: "https://www.linkedin.com/in/alexanderlevshenko",
    email: "stallev@gmail.com",
    emailHref: "mailto:stallev@gmail.com",
  },
  cta: {
    title: "Explore the live application",
    description:
      "Browse the trainer catalog, walk through booking flows, or register as a trainer to see onboarding.",
    primary: "Browse trainers",
    secondary: "Sign in",
  },
} as const;
