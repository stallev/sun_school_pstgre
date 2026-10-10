export const howItWasBuiltRu = {
  meta: {
    title: "Как создан Pulse — full-stack кейс",
    description:
      "Один разработчик, ~26 часов от спецификации до деплоя: AI-first методология, monorepo-архитектура и production-grade MVP маркетплейса фитнес-тренеров.",
    keywords: [
      "кейс",
      "Next.js",
      "full-stack",
      "разработка с AI",
      "маркетплейс тренеров",
      "Pulse",
      "TypeScript monorepo",
    ],
    ogImageAlt: "Как создан Pulse — кейс разработки",
  },
  nav: {
    link: "Как создано",
  },
  toc: {
    ariaLabel: "Разделы страницы",
    label: "На этой странице",
  },
  hero: {
    eyebrow: "Кейс разработки",
    title: "От спецификации",
    titleAccent: "до production за ~26 часов",
    subcopy:
      "Pulse — full-stack маркетплейс фитнес-тренеров, созданный одним разработчиком с Cursor и Claude Code по явным архитектурным контрактам, а не на no-code конструкторах.",
    kpis: [
      { value: "~26 ч", label: "Spec → deploy" },
      { value: "1", label: "Разработчик" },
      { value: "3", label: "Роли" },
      { value: "50+", label: "Маршрутов" },
    ],
  },
  overview: {
    id: "overview",
    title: "Обзор",
    paragraphs: [
      "Pulse соединяет клиентов с проверенными фитнес-тренерами: поиск, бронирование, онбординг тренера и админ-модерация — полный цикл маркетплейса без оплаты на MVP.",
      "Эта страница описывает, как создано приложение: сроки, архитектура, функционал и точки расширения, уже заложенные в схему БД.",
      "Цель — показать, что современные веб-приложения можно поставлять быстро, сохраняя инженерные стандарты: типизированный domain-слой, ADR, доступность и двуязычный UI.",
    ],
    highlights: [
      "Не создано в Lovable, Replit и аналогичных no-code платформах",
      "AI ускорил реализацию по письменным контрактам и чеклистам фаз",
      "Production-деплой на Vercel с Neon PostgreSQL",
    ],
  },
  timeline: {
    id: "timeline",
    title: "Хронология",
    intro: "Один сфокусированный спринт от продуктового определения до работающего приложения.",
    steps: [
      {
        phase: "Спецификация",
        detail:
          "PRD, user flows, схема БД, ADR, implementation contracts и HTML-прототип — AI-first методология с единым источником истины по каждой теме.",
      },
      {
        phase: "Design system",
        detail:
          "Токены Warm Forest, типографическая шкала и каталог Design Lab на /design-system для переиспользуемых UI-примитивов.",
      },
      {
        phase: "Реализация",
        detail:
          "Monorepo (apps/web + packages/domain, policy, db), фазы P01–P14: auth, каталог, бронирование, инструменты тренера, админ-модерация.",
      },
      {
        phase: "Качество и i18n",
        detail:
          "Локали EN/RU, семантика под WCAG, pending UI для мутаций, fallback-транспорт для iOS Safari, typecheck и lint.",
      },
      {
        phase: "Деплой",
        detail:
          "Production-сборка на Vercel, конфигурация окружения, seed-данные для демо-ролей (client, trainer, admin).",
      },
    ],
  },
  product: {
    id: "product",
    title: "Функционал продукта",
    intro:
      "MVP покрывает discovery и бронирование клиента, онбординг и расписание тренера, модерацию админа — полные циклы маркетплейса без оплаты на MVP.",
    summaries: [
      "Клиент — каталог, wizard бронирования, брони, отзывы, жалобы",
      "Тренер — онбординг, услуги, расписание, клиенты, завершение сессии",
      "Админ — верификация, модерация отзывов, жалобы, возвраты",
    ],
    featuresLink: "Полный обзор функционала",
    featuresHref: "/features",
    note: "На MVP бронирование без онлайн-оплаты — осознанное решение (ADR-005).",
  },
  architecture: {
    id: "architecture",
    title: "Архитектура",
    intro:
      "Слоистый monorepo со строгими границами — web-приложение как тонкий BFF, бизнес-правила в packages.",
    layers: [
      {
        name: "apps/web",
        description:
          "Next.js 16.3.0 App Router — Server Components, Server Actions, Route Handlers, proxy.ts для auth.",
      },
      {
        name: "@pulse/domain",
        description:
          "Чистые бизнес-правила, use-cases, Zod DTO, коды ошибок мутаций — без импортов Next.js и Prisma.",
      },
      {
        name: "@pulse/policy-server / policy-edge",
        description:
          "Object-level авторизация с Prisma на сервере; JWT-проверки на edge — без БД в proxy.",
      },
      {
        name: "@pulse/db",
        description: "Prisma v7 на Neon PostgreSQL 17 — канон DDL, миграции, seed.",
      },
    ],
    decisions: [
      "Auth.js v5 Credentials + JWT-сессии; роль в токене (client | trainer | admin)",
      "TrainerProfile.timezone — единый источник истины для слотов и отображения",
      "Переходы статусов брони только через документированные domain use-cases",
      "Загрузка файлов через presigned S3 URL (ADR-007)",
      "Cookie-first i18n (EN/RU) без префиксов /[lang]/ в URL (ADR-009)",
    ],
  },
  methodology: {
    id: "methodology",
    title: "AI-first методология",
    intro:
      "AI-агенты следуют тому же циклу, что и дисциплинированная команда — контекст до кода.",
    cycle: [
      "Контекст — AGENTS.md, описание фазы, contracts",
      "Фаза — ограниченный deliverable с явным in/out of scope",
      "Контракт — формы API, маршруты, инварианты до реализации",
      "Задачи — чеклист с шагами верификации",
      "Верификация — typecheck, lint, ручные сценарии, актуализация docs",
    ],
    closing:
      "Cursor и Claude Code работали в этой рамке. Архитектурные решения принимал разработчик и фиксировал в ADR — AI ускорил набор и итерации, но не заменил проектирование системы.",
  },
  roadmap: {
    id: "roadmap",
    title: "Заложенная roadmap",
    intro:
      "Post-MVP возможности отложены в продукте, но подготовлены в схеме и документации — без breaking migrations при включении.",
    tableHeaders: {
      feature: "Функция",
      status: "Статус",
    },
    items: [
      {
        feature: "Stripe Connect — оплата",
        status: "Nullable-колонки в схеме; маршруты зарезервированы",
      },
      {
        feature: "Видеосессии Daily.co",
        status: "Поля комнаты в booking + placeholder /sessions",
      },
      {
        feature: "Транзакционный email (Resend)",
        status: "Таблицы job_execution и delivery_log готовы",
      },
      {
        feature: "OAuth (Google)",
        status: "Путь через amendment ADR задокументирован",
      },
      {
        feature: "Wishlist клиента",
        status: "Domain + schema готовы; UI отложен",
      },
      {
        feature: "Background workers",
        status: "apps/workers запланирован; Vercel Cron для MVP-масштаба",
      },
    ],
  },
  stack: {
    id: "stack",
    title: "Стек и стандарты",
    intro: "Зафиксированные версии и явное governance — не случайный набор зависимостей.",
    rows: [
      { label: "Framework", value: "Next.js 16.3.0 App Router, React 19, TypeScript" },
      { label: "Hosting", value: "Vercel (serverless, preview deploys)" },
      { label: "Database", value: "Neon PostgreSQL 17 + Prisma v7" },
      { label: "Auth", value: "Auth.js v5 Credentials, JWT RBAC" },
      { label: "UI", value: "shadcn/ui, Tailwind CSS v4, design system Warm Forest" },
      { label: "Storage", value: "AWS S3 presigned uploads" },
      { label: "i18n", value: "EN / RU, cookie-first locale resolution" },
      { label: "UX", value: "Sonner toasts, pending states, цель WCAG 2.1 AA" },
      { label: "Observability", value: "Sentry — error tracking и performance tracing" },
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
    title: "Отслеживание ошибок",
    intro:
      "Production-ошибки фиксируются в Sentry во всех runtime: browser, Node.js server и Edge — с читаемыми stack traces и привязкой к release на каждом деплое Vercel.",
    rows: [
      { label: "Платформа", value: "Sentry (@sentry/nextjs) — проект fitapp" },
      { label: "Runtime", value: "Client, Server Components, Server Actions, Route Handlers, proxy.ts" },
      { label: "Source maps", value: "Загрузка при сборке через SENTRY_AUTH_TOKEN" },
      { label: "Ad-blocker bypass", value: "Tunnel route /monitoring" },
      { label: "Privacy", value: "sendDefaultPii: false — без email и паролей в событиях" },
      { label: "Окружения", value: "localhost, preview и production" },
    ],
    points: [
      "global-error.tsx отправляет fatal React render failures; route-level error.tsx сохраняет user-friendly retry UI",
      "Тег submit_transport на мутациях разделяет Server Actions и iOS Safari Route Handler fallback (Class B flows)",
      "Session Replay отложен — на MVP только error monitoring и tracing",
      "Structured server logging остаётся в observability_plan.md для Vercel function logs",
    ],
  },
  developer: {
    id: "developer",
    title: "О разработчике",
    name: "Александр Левшенко",
    role: "Full-stack web-разработчик",
    bio: "Александр создаёт production web-приложения на React, Next.js и TypeScript. Совмещает hands-on full-stack delivery со структурированной документацией и AI-assisted workflow — поставляет цельные продукты быстро, не жертвуя архитектурой, доступностью и поддерживаемостью.",
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
    title: "Изучите приложение",
    description:
      "Откройте каталог тренеров, пройдите сценарий бронирования или зарегистрируйтесь как тренер, чтобы увидеть онбординг.",
    primary: "Каталог тренеров",
    secondary: "Войти",
  },
} as const;
