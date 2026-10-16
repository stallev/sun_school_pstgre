import type { MessageLocale } from "@/lib/messages/get-dictionary";

export type PrivacyContent = {
  summaryBullets: string[];
  sections: Array<{ title: string; body: string[] }>;
};

const CONTENT: Record<MessageLocale, Omit<PrivacyContent, never>> = {
  ru: {
    summaryBullets: [
      "Имя пользователя Telegram и телефон (если вы разрешили доступ)",
      "Фамилия, имя и отчество для учёта в воскресной школе",
      "Email администратора для входа по паролю",
      "Удаление — по запросу в приложении (раздел профиля)",
    ],
    sections: [
      {
        title: "Что собираем",
        body: [
          "Имя пользователя и телефон из Telegram, если вы разрешили их передать при входе.",
          "Фамилия, имя и отчество, которые вы указываете при регистрации.",
          "Email администратора, используемый только для входа по паролю.",
        ],
      },
      {
        title: "Зачем",
        body: [
          "Ведение учёта в воскресной школе: группы, уроки, домашние задания и посещаемость.",
          "Связь с администратором по вопросам доступа и учётной записи.",
        ],
      },
      {
        title: "Где храним",
        body: [
          "Данные хранятся в облачной базе PostgreSQL (регион провайдера Neon).",
          "Резервные копии создаются по политике оператора инфраструктуры.",
        ],
      },
      {
        title: "Как удалить",
        body: [
          "Вы можете запросить удаление или обезличивание данных через раздел профиля.",
          "Администратор обрабатывает запрос в сроки, указанные в регламенте школы.",
        ],
      },
    ],
  },
  en: {
    summaryBullets: [
      "Telegram username and phone (if you allowed access)",
      "Last, first and middle name for Sunday school records",
      "Administrator email for password sign-in",
      "Deletion — request it in the app (profile section)",
    ],
    sections: [
      {
        title: "What we collect",
        body: [
          "Telegram username and phone when you allow them during sign-in.",
          "Last, first and middle name you provide at registration.",
          "Administrator email used only for password sign-in.",
        ],
      },
      {
        title: "Why",
        body: [
          "Sunday school operations: groups, lessons, homework and attendance.",
          "Contact with the administrator about access and your account.",
        ],
      },
      {
        title: "Where stored",
        body: [
          "Data is stored in a cloud PostgreSQL database (Neon provider region).",
          "Backups follow the infrastructure operator policy.",
        ],
      },
      {
        title: "How to delete",
        body: [
          "You can request deletion or anonymization from the profile section.",
          "The administrator processes requests per the school policy.",
        ],
      },
    ],
  },
};

export const getPrivacyContent = (locale: MessageLocale): PrivacyContent => CONTENT[locale];
