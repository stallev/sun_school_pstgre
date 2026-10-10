export const platformFeaturesRu = {
  meta: {
    title: "Функционал платформы — Pulse MVP",
    description:
      "Рабочие сценарии клиента, тренера и админа в Pulse: каталог, бронирование, онбординг, модерация, i18n и demo paths для проверки приложения.",
    keywords: [
      "функционал Pulse",
      "маркетплейс тренеров",
      "бронирование",
      "MVP",
      "демо",
    ],
    ogImageAlt: "Функционал платформы Pulse — обзор MVP",
  },
  nav: {
    link: "Функционал платформы",
  },
  toc: {
    ariaLabel: "Разделы страницы",
    label: "На этой странице",
  },
  hero: {
    eyebrow: "Обзор функций MVP",
    title: "Всё, что работает",
    titleAccent: "в Pulse сегодня",
    subcopy:
      "Реальные маршруты, потоки данных и production-grade UX — не статичный прототип. Что может каждая роль прямо сейчас.",
    kpis: [
      { value: "3", label: "Роли" },
      { value: "50+", label: "Маршрутов" },
      { value: "EN/RU", label: "Локали UI" },
      { value: "Live", label: "Бронирование и модерация" },
    ],
  },
  shared: {
    id: "shared",
    title: "Общая платформа",
    intro: "Сквозные возможности, доступные во всём приложении.",
    items: [
      {
        title: "Аутентификация",
        description:
          "Вход и регистрация по email + пароль. JWT-сессии с ролью в токене (client, trainer, admin). Защита маршрутов через proxy.",
        href: "/auth/login",
        linkLabel: "Войти",
        status: "live",
      },
      {
        title: "Global UI shell",
        description:
          "Адаптивный top bar, bottom navigation на mobile, sidebar на desktop. Навигация по роли для авторизованных пользователей.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Интернационализация",
        description:
          "UI на EN и RU с cookie-first locale, переключатель в header и профиле, локализованные даты и тексты.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Обратная связь при мутациях",
        description:
          "Sonner toasts после create/update/delete, pending-состояния на submit, optimistic toggles где уместно.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Загрузка файлов",
        description:
          "Presigned S3 для фото профиля, сертификатов и документов верификации при онбординге тренера.",
        href: null,
        linkLabel: null,
        status: "live",
      },
      {
        title: "Design system",
        description:
          "Токены Warm Forest и typography atoms в продуктовом UI. Dev-каталог компонентов (/design-system) — только для локальной разработки.",
        href: null,
        linkLabel: null,
        status: "live",
      },
    ],
  },
  client: {
    id: "client",
    title: "Клиент",
    intro: "Поиск, бронирование и сценарии после сессии для пользователей, ищущих тренера.",
    items: [
      {
        title: "Дашборд",
        description: "Главная с приветствием, ближайшей сессией, поиском, категориями и топ-тренерами.",
        href: "/client/dashboard",
        linkLabel: "Открыть дашборд",
        status: "live",
      },
      {
        title: "Каталог тренеров",
        description: "Список с фильтрами по специализации, цене, рейтингу, сортировкой, пагинацией и поиском.",
        href: "/trainers",
        linkLabel: "Каталог",
        status: "live",
      },
      {
        title: "Профиль тренера",
        description: "Публичный профиль: about, услуги, превью расписания, отзывы и CTA «Забронировать».",
        href: "/trainers",
        linkLabel: "Смотреть тренеров",
        status: "live",
      },
      {
        title: "Wizard бронирования",
        description: "Три шага: услуга, слот, подтверждение. Создаёт pending-бронь без онлайн-оплаты.",
        href: "/trainers",
        linkLabel: "Начать с каталога",
        status: "live",
      },
      {
        title: "Мои бронирования",
        description: "Предстоящие, прошедшие и отменённые сессии со статусами и быстрыми действиями.",
        href: "/client/bookings",
        linkLabel: "Список броней",
        status: "live",
      },
      {
        title: "Детали брони",
        description: "Сводка сессии, информация о тренере, отмена, жалоба или возврат при eligibility.",
        href: "/client/bookings",
        linkLabel: "Список броней",
        status: "live",
      },
      {
        title: "Отзыв после сессии",
        description: "Оценка и текстовый отзыв о тренере после completed-сессии.",
        href: "/client/bookings",
        linkLabel: "Из завершённой брони",
        status: "live",
      },
      {
        title: "Жалобы и возвраты",
        description: "Подать жалобу или запросить возврат с экрана деталей подходящей брони.",
        href: "/client/bookings",
        linkLabel: "Из деталей брони",
        status: "live",
      },
      {
        title: "Профиль и язык",
        description: "Настройки аккаунта и явный выбор EN/RU.",
        href: "/client/profile",
        linkLabel: "Профиль",
        status: "live",
      },
    ],
  },
  trainer: {
    id: "trainer",
    title: "Тренер",
    intro: "Онбординг, расписание, услуги и работа с клиентами для фитнес-специалистов.",
    items: [
      {
        title: "Регистрация и онбординг",
        description:
          "Многошаговый wizard: credentials, личные данные, профессиональная информация, сертификаты, услуги, превью и submit.",
        href: "/auth/register/trainer",
        linkLabel: "Стать тренером",
        status: "live",
      },
      {
        title: "Дашборд",
        description: "Сессии на сегодня, KPI, свежие отзывы и быстрые ссылки на расписание и услуги.",
        href: "/trainer/dashboard",
        linkLabel: "Дашборд",
        status: "live",
      },
      {
        title: "Редактирование профиля",
        description: "Bio, фото, специализации, язык. Публичный listing только после approve админом.",
        href: "/trainer/profile",
        linkLabel: "Профиль",
        status: "live",
      },
      {
        title: "Услуги",
        description: "Создание, редактирование, удаление услуг с ценой, длительностью и toggle active/hidden.",
        href: "/trainer/services",
        linkLabel: "Услуги",
        status: "live",
      },
      {
        title: "Недельное расписание",
        description: "Повторяющаяся доступность; timezone тренера — источник истины для слотов.",
        href: "/trainer/schedule",
        linkLabel: "Расписание",
        status: "live",
      },
      {
        title: "Исключения расписания",
        description: "Блокировка дат или override часов без изменения базового weekly template.",
        href: "/trainer/schedule",
        linkLabel: "Расписание",
        status: "live",
      },
      {
        title: "Клиенты",
        description: "Список клиентов с историей броней и приватными заметками.",
        href: "/trainer/clients",
        linkLabel: "Клиенты",
        status: "live",
      },
      {
        title: "Завершение сессии",
        description:
          "Для confirmed-броней — отметить сессию completed; клиент получает in-app prompt на отзыв.",
        href: "/trainer/clients",
        linkLabel: "Из списка клиентов",
        status: "live",
      },
      {
        title: "Доход",
        description:
          "История сессий и сводка заработка по completed-броням. Stripe payouts на MVP не подключены.",
        href: "/trainer/income",
        linkLabel: "Доход",
        status: "live",
      },
    ],
  },
  admin: {
    id: "admin",
    title: "Админ",
    intro: "Модерация, верификация и операционные задачи платформы.",
    items: [
      {
        title: "Дашборд",
        description: "KPI, регистрации, открытые очереди, GMV и блок needs-attention.",
        href: "/admin/dashboard",
        linkLabel: "Дашборд",
        status: "live",
      },
      {
        title: "Верификация тренеров",
        description: "Очередь заявок, просмотр документов, approve или reject с причиной.",
        href: "/admin/trainers",
        linkLabel: "Очередь тренеров",
        status: "live",
      },
      {
        title: "Модерация отзывов",
        description: "Скрытие или удаление отзывов, нарушающих правила платформы.",
        href: "/admin/reviews",
        linkLabel: "Очередь отзывов",
        status: "live",
      },
      {
        title: "Разбор жалоб",
        description:
          "Triage открытых жалоб, контекст брони и закрытие с resolution и admin notes.",
        href: "/admin/complaints",
        linkLabel: "Жалобы",
        status: "live",
      },
      {
        title: "Обработка возвратов",
        description: "Ручная очередь возвратов — статусы в БД без Stripe API на MVP.",
        href: "/admin/refunds",
        linkLabel: "Возвраты",
        status: "live",
      },
    ],
  },
  demo: {
    id: "demo",
    title: "Demo paths",
    intro: "Готовые сценарии, чтобы оценить приложение за несколько минут.",
    paths: [
      {
        title: "Guest discovery",
        steps: ["Открыть /trainers", "Применить фильтры и открыть профиль", "Book — войти по запросу"],
        href: "/trainers",
        linkLabel: "Каталог",
      },
      {
        title: "Client booking",
        steps: [
          "Войти как client@pulse.dev",
          "Забронировать через wizard",
          "Открыть /client/bookings/[id]",
        ],
        href: "/auth/login?demo=client",
        linkLabel: "Попробовать как клиент",
      },
      {
        title: "Admin moderation",
        steps: [
          "Войти как admin@pulse.dev",
          "Открыть /admin/dashboard",
          "Проверить тренера на /admin/trainers",
        ],
        href: "/auth/login?demo=admin",
        linkLabel: "Попробовать как админ",
      },
    ],
    credentialsNote:
      "Учётные данные подставляются автоматически на странице входа.",
  },
  boundaries: {
    id: "boundaries",
    title: "Границы MVP",
    intro: "Функции, которые не входят в текущий MVP-релиз.",
    plannedNote:
      "Stripe (онлайн-оплата и выплаты тренерам) и Daily.co (видеосессии) запланированы в roadmap и будут интегрированы в следующих релизах. Связанные поля в базе данных уже подготовлены.",
    tableHeaders: {
      feature: "Функция",
      status: "Статус",
    },
    items: [
      {
        feature: "Онлайн-оплата (Stripe Connect)",
        status: "Запланировано — checkout и payouts через Stripe Connect",
      },
      {
        feature: "Видеосессии (Daily.co)",
        status: "Запланировано — видео в сессии через Daily.co rooms",
      },
      { feature: "Транзакционный email", status: "Таблицы готовы — без отправки на MVP" },
      { feature: "OAuth (Google)", status: "Post-MVP" },
      { feature: "Сброс пароля по email", status: "Post-MVP" },
    ],
    roadmapLink: "Architecture roadmap",
    roadmapHref: "/how-it-was-built#roadmap",
  },
  statusLabels: {
    live: "Live",
    stub: "Stub",
  },
  cta: {
    title: "Как это построено?",
    description: "Timeline, архитектура, AI-first методология и post-MVP roadmap — на странице кейса.",
    primary: "Как создано",
    primaryHref: "/how-it-was-built",
    secondary: "Каталог тренеров",
    secondaryHref: "/trainers",
  },
} as const;
