/**
 * Fictional demo content for the Design Lab only (spec §7, C-6). Never import from product routes;
 * no real people, no DB, no session.
 */

export const LAB_STUDENT = {
  name: "Иван Петров",
  group: "Группа «Ковчег»",
  lesson: "Урок 12 · 15 ноября",
} as const;

export const LAB_TEXT = {
  fieldLabel: "Имя ученика",
  fieldPlaceholder: "Введите имя",
  fieldHelp: "Как в журнале группы",
  fieldError: "Укажите имя ученика",
  dialogTitle: "Удалить запись?",
  dialogBody: "Действие нельзя отменить. Запись исчезнет из журнала.",
  confirm: "Удалить",
  cancel: "Отмена",
  close: "Закрыть",
  save: "Сохранить",
  emptyTitle: "Пока нет учеников",
  emptyBody: "Добавьте первого ученика, чтобы начать вести журнал.",
  errorTitle: "Не удалось загрузить данные",
  errorBody: "Проверьте соединение и повторите попытку.",
  forbiddenTitle: "Нет доступа",
  forbiddenBody: "Этот раздел доступен только администратору.",
  retry: "Повторить",
  bannerTitle: "Проверка не сохранена",
  bannerBody: "Оценки не отправлены. Попробуйте ещё раз.",
  disclosureTitle: "Подробности урока",
  disclosureBody: "Тема, стихи для заучивания и домашнее задание.",
  toast: "Сохранено",
  tableEmpty: "Нет записей",
  drawerTitle: "Меню",
  homeworkItem: "Заучивание стиха",
  scoreNotRated: "Не оценивалось",
  calendarOpen: "Открыть календарь",
} as const;

export const LAB_TABLE_ROWS = [
  { student: "Иван Петров", score: 5, status: "Проверено" },
  { student: "Мария Орлова", score: 4, status: "Проверено" },
  { student: "Павел Смирнов", score: 0, status: "Не сдано" },
] as const;

export const LAB_SEGMENTS = [
  { value: "all", label: "Все" },
  { value: "done", label: "Сдано" },
  { value: "late", label: "Позже" },
  { value: "none", label: "Нет", disabled: true },
] as const;

export const LAB_SELECT_OPTIONS = ["Ковчег", "Маяк", "Звезда"] as const;
