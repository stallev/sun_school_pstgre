import type { MessageLocale } from "@/lib/messages/get-dictionary";

export type PrivacyContent = {
  summaryBullets: string[];
  sections: Array<{ title: string; body: string[] }>;
};

/** `/privacy` v1 — consent for teacher/admin PD (РГ-2). Version: `app_setting.consent_text_version` = v1. */
const CONTENT: Record<MessageLocale, Omit<PrivacyContent, never>> = {
  ru: {
    summaryBullets: [
      "ФИО, идентификатор Telegram и при разрешении — имя и фото из Telegram",
      "Email администратора — только для входа по паролю",
      "Удаление своих данных — в профиле; срок выполнения — до 15 календарных дней",
    ],
    sections: [
      {
        title: "Оператор",
        body: [
          "Оператор персональных данных — администрация воскресной школы (церковь), использующая это приложение.",
        ],
      },
      {
        title: "Что собираем",
        body: [
          "Фамилия, имя и отчество, которые вы указываете при регистрации.",
          "Идентификатор учётной записи Telegram и, если вы разрешили провайдеру, отображаемое имя и фото профиля Telegram.",
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
          "Данные хранятся в облачной базе PostgreSQL (провайдер Neon; регион определяется настройками проекта).",
          "Резервные копии создаются автоматически по политике провайдера.",
        ],
      },
      {
        title: "Сроки и резервные копии",
        body: [
          "Запрос на удаление или обезличивание ваших данных выполняется не позднее чем через 15 календарных дней с даты запроса, если иное не требуется законом.",
          "Удалённые данные могут оставаться в резервных копиях и в окне восстановления базы до 1 календарного дня (point-in-time recovery на prod). После истечения этого срока копии обновляются; при восстановлении базы из копии выполненные запросы на удаление применяются повторно (УД-11).",
        ],
      },
      {
        title: "Как удалить",
        body: [
          "Вы можете запросить удаление или обезличивание своих данных через раздел профиля; до выполнения запрос можно отменить.",
          "Данные детей обрабатываются на отдельном основании согласия опекуна; этот текст относится только к вашей учётной записи.",
        ],
      },
    ],
  },
  en: {
    summaryBullets: [
      "Name, Telegram account id and, if allowed, Telegram display name and photo",
      "Administrator email for password sign-in only",
      "Delete your data from profile; fulfilled within 15 calendar days",
    ],
    sections: [
      {
        title: "Controller",
        body: [
          "The data controller is the Sunday school administration (church) operating this application.",
        ],
      },
      {
        title: "What we collect",
        body: [
          "Last, first and middle name you provide at registration.",
          "Telegram account identifier and, if you allowed the provider, your Telegram display name and profile photo.",
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
          "Data is stored in a cloud PostgreSQL database (Neon; region depends on project settings).",
          "Backups are created automatically under the provider policy.",
        ],
      },
      {
        title: "Retention and backups",
        body: [
          "We fulfil deletion or anonymization requests within 15 calendar days of the request unless law requires otherwise.",
          "Deleted data may remain in backups and the database recovery window for up to 1 calendar day (point-in-time recovery on production). After that window rolls forward, backups are refreshed; if the database is restored from a backup, completed deletion requests are applied again (UD-11).",
        ],
      },
      {
        title: "How to delete",
        body: [
          "Request deletion or anonymization from the profile section; you may cancel until the request is executed.",
          "Children’s data is handled under separate guardian consent; this notice covers only your user account.",
        ],
      },
    ],
  },
};

export const getPrivacyContent = (locale: MessageLocale): PrivacyContent => CONTENT[locale];
