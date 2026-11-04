import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonthHeader } from "./CalendarMonthHeader";
import type { TeacherCalendarMessages } from "@/lib/messages/teacher-calendar-messages";

vi.mock("@/components/ui/custom-link", () => ({
  CustomLink: ({
    children,
    href,
    "aria-label": ariaLabel,
    "aria-current": ariaCurrent,
  }: {
    children?: React.ReactNode;
    href?: string;
    "aria-label"?: string;
    "aria-current"?: React.AnchorHTMLAttributes<HTMLAnchorElement>["aria-current"];
  }) => (
    <a href={href} aria-label={ariaLabel} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

const baseMessages: TeacherCalendarMessages = {
  pageTitle: "Calendar",
  pageSubtitle: "{group} · {year}",
  newEvent: "Event",
  monthEventsTitle: "Events",
  emptyMonth: "Empty",
  emptyMonthCta: "Add",
  typeLesson: "Lesson",
  typeTrip: "Trip",
  typeCancellation: "Cancel",
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  prevMonth: "Previous month",
  nextMonth: "Next month",
  today: "Today",
  openLesson: "Open",
  formCreateTitle: "New",
  formEditTitle: "Edit",
  dateLabel: "Date",
  typeLabel: "Type",
  titleLabel: "Title",
  descriptionLabel: "Description",
  lessonLinkLabel: "Lesson",
  lessonLinkNone: "None",
  save: "Save",
  delete: "Delete",
  cancel: "Cancel",
  deleteConfirmTitle: "Delete?",
  deleteConfirmDescription: "Gone",
  toastCreated: "Created",
  toastUpdated: "Updated",
  toastDeleted: "Deleted",
  birthday: "Birthday: {name}",
  locale: "RU",
};

describe("CalendarMonthHeader", () => {
  it("renders month title between arrows with school-today link", () => {
    const html = renderToStaticMarkup(
      <CalendarMonthHeader
        gradeId="g1"
        monthKey="2026-11"
        todayMonthKey="2026-11"
        calendarHref={(gradeId, month) => `/calendar?gradeId=${gradeId}&month=${month}`}
        messages={baseMessages}
      />,
    );
    expect(html).toContain("<h2");
    expect(html).toContain('aria-live="polite"');
    expect(html).toMatch(/Ноябрь 2026/);
    expect(html).toContain('aria-current="date"');
    expect(html).toContain('aria-label="Октябрь"');
    expect(html).toContain('aria-label="Декабрь"');
    expect(html).toContain("month=2026-11");
  });

  it("omits aria-current on Today when another month is open", () => {
    const html = renderToStaticMarkup(
      <CalendarMonthHeader
        gradeId="g1"
        monthKey="2026-01"
        todayMonthKey="2026-11"
        calendarHref={(gradeId, month) => `/calendar?gradeId=${gradeId}&month=${month}`}
        messages={baseMessages}
      />,
    );
    expect(html).not.toContain('aria-current="date"');
    expect(html).toContain('aria-label="Декабрь"');
    expect(html).toContain('aria-label="Февраль"');
    expect(html).toContain("month=2026-11");
  });
});
