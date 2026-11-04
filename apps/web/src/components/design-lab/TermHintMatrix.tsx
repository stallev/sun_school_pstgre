"use client";

import { ContentText } from "@/components/atoms/ContentText";
import commonRu from "@/lib/messages/ru/common.json";
import { pickGlossaryUiMessages, GLOSSARY_TERM_KEYS } from "@/lib/messages/pick-glossary-messages";
import { fillMessage } from "@/lib/messages/fill-message";
import { TermHint } from "@/components/ui/term-hint";
import { TermHeader } from "@/components/ui/term-header";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";
import { termHintLabSection } from "@/lib/design-lab/sections";
import { MatrixCell } from "./MatrixCell";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";

const glossary = pickGlossaryUiMessages(commonRu);
const aria = (term: string) => fillMessage(glossary.termHintAriaLabel, { term });

const longHint =
  "Очень длинное пояснение термина для проверки переноса строк в узкой панели на мобильном экране без обрезки смысла и без горизонтальной прокрутки всей страницы.";

export const TermHintMatrix = () => (
  <div className="grid gap-4 md:grid-cols-2">
    <MatrixCell label="TermLabel · в абзаце">
      <ContentText className="text-sm text-muted-foreground">
        <TermLabel
          term={nonEmptyTerm(glossary.attendance.term)}
          hint={glossary.attendance.hint}
          ariaLabel={aria(glossary.attendance.term)}
        />
      </ContentText>
    </MatrixCell>
    <MatrixCell label="TermLabel · в таблице (popover вверх)">
      <Table className="text-sm">
        <TableHeader>
          <TableRow>
            <TermHeader
              className="px-3 py-2 text-right"
              term={nonEmptyTerm(glossary.verses_per_lesson.term)}
              hint={glossary.verses_per_lesson.hint}
              ariaLabel={aria(glossary.verses_per_lesson.term)}
            />
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>
    </MatrixCell>
    <MatrixCell label="TermLabel · длинный текст">
      <TermLabel
        term={nonEmptyTerm("Длинный термин")}
        hint={longHint}
        ariaLabel={aria("Длинный термин")}
      />
    </MatrixCell>
    <MatrixCell label="TermLabel · у правого края">
      <div className="flex w-full justify-end">
        <TermLabel
          term={nonEmptyTerm(glossary.lesson_points.term)}
          hint={glossary.lesson_points.hint}
          ariaLabel={aria(glossary.lesson_points.term)}
        />
      </div>
    </MatrixCell>
    <MatrixCell label="TermLabel · reason (неактивный)">
      <TermLabel
        variant="reason"
        term={nonEmptyTerm("Только для учителей")}
        hint="Рейтинг видят учителя и администратор."
        ariaLabel="Почему пункт недоступен"
      />
    </MatrixCell>
    <MatrixCell label="TermHint · low-level (Lab only)">
      <TermHint
        term={glossary.test.term}
        hint={glossary.test.hint}
        ariaLabel={aria(glossary.test.term)}
      />
    </MatrixCell>
    <MatrixCell label={`Glossary (${termHintLabSection.id})`}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {GLOSSARY_TERM_KEYS.map((key) => (
          <li key={key}>
            <TermLabel
              term={nonEmptyTerm(glossary[key].term)}
              hint={glossary[key].hint}
              ariaLabel={aria(glossary[key].term)}
            />
          </li>
        ))}
      </ul>
    </MatrixCell>
  </div>
);
