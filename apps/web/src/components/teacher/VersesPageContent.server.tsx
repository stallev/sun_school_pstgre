import { connection } from "next/server";
import { USER_ROLE } from "@sunschool/domain";
import { VersesAddVerseDialog } from "@/components/teacher/VersesAddVerseDialog.client";
import { VersesCatalog } from "@/components/teacher/VersesCatalog.client";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { loadVersesCatalogPage } from "@/data/lessons/load-verses-catalog-page.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { messageLocaleToAppLocale } from "@/lib/i18n/message-locale-to-app-locale";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";
import { pickTeacherLessonFormMessages } from "@/lib/messages/pick-teacher-lesson-messages.server";
import { pickTeacherLessonScreensMessages } from "@/lib/messages/pick-teacher-lesson-screens-messages.server";
import { pickTeacherHintsSubset } from "@/lib/messages/pick-teacher-hints-messages.server";

export type VersesPageProps = {
  searchParams: Promise<{ gradeId?: string }>;
};

export const VersesPageContent = async ({ searchParams }: VersesPageProps) => {
  await connection();
  const params = await searchParams;
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const locale = await getUiLocale();
  const appLocale = messageLocaleToAppLocale(locale);
  const data = await loadVersesCatalogPage(
    await getPrisma(),
    actor.userId,
    params.gradeId ?? null,
    appLocale,
  );
  const teacherDict = await getDictionary(locale, "teacher");
  const commonDict = await getDictionary(locale, "common");
  const messages = pickTeacherLessonScreensMessages(teacherDict, appLocale);
  const versesOrderHint = pickTeacherHintsSubset(teacherDict, ["verses_order"] as const).verses_order;
  const pickerMessages = pickTeacherLessonFormMessages(teacherDict, appLocale);

  if (data.kind === "no_active_year") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.versesPageTitle} />
        <EmptyState
          title={getMessage(teacherDict, "lesson.no_year_title")}
          description={getMessage(teacherDict, "lesson.no_year_description")}
        />
      </div>
    );
  }

  if (data.kind === "unassigned") {
    return (
      <div className="space-y-6">
        <PageHeader title={messages.versesPageTitle} />
        <EmptyState title={messages.unassignedTitle} description={messages.unassignedDescription} />
      </div>
    );
  }

  const catalogRows = data.rows.map((row) => ({
    refLabel: row.refLabel,
    text: row.text,
    hasMissing: row.hasMissing,
    bookId: row.bookId,
    bookSortOrder: row.bookSortOrder,
    bookLabel: row.bookLabel,
    startChapter: row.startChapter,
    startVerse: row.startVerse,
    minLessonOrdinal: row.minLessonOrdinal,
    usages: row.usages.map((usage) => ({
      lessonId: usage.lessonId,
      ordinal: usage.ordinal,
      linkLabel: String(usage.ordinal),
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.versesPageTitle}
        description={messages.versesLibraryDescription}
        actions={
          <VersesAddVerseDialog
            gradeId={data.pickerGradeId}
            books={data.books}
            pickerMessages={pickerMessages}
            title={messages.versesAddDialogTitle}
            description={messages.versesAddDialogDescription}
            triggerLabel={messages.versesAddButton}
            closeLabel={getMessage(commonDict, "shell.close")}
          />
        }
      />
      <VersesCatalog
        rows={catalogRows}
        messages={{
          searchLabel: messages.versesSearchLabel,
          searchPlaceholder: messages.versesSearchPlaceholder,
          searchEmpty: messages.versesSearchEmpty,
          verseMissing: messages.verseMissing,
          lessonsPrefix: messages.versesLessonsPrefix,
          sortLabel: messages.versesSortLabel,
          sortByBible: messages.versesSortByBible,
          sortByLessons: messages.versesSortByLessons,
          notUsed: messages.versesNotUsed,
          emptyTitle: messages.emptyVersesTitle,
          emptyDescription: messages.emptyVersesDescription,
          versesOrderHint,
          termHintAriaLabel: getMessage(commonDict, "term_hint.aria_label"),
        }}
      />
    </div>
  );
};

