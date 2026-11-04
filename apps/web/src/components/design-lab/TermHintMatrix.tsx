"use client";

import commonRu from "@/lib/messages/ru/common.json";
import { pickGlossaryMessages, GLOSSARY_TERM_KEYS } from "@/lib/messages/pick-glossary-messages";
import { TermHint } from "@/components/ui/term-hint";
import { termHintLabSection } from "@/lib/design-lab/sections";
import { MatrixCell } from "./MatrixCell";

const glossary = pickGlossaryMessages(commonRu);

const longHint =
  "Очень длинное пояснение термина для проверки переноса строк в узкой панели на мобильном экране без обрезки смысла и без горизонтальной прокрутки всей страницы.";

export const TermHintMatrix = () => (
  <div className="grid gap-4 md:grid-cols-2">
    <MatrixCell label="Closed (default)">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        Средняя явка
        <TermHint term={glossary.attendance.term} hint={glossary.attendance.hint} />
      </span>
    </MatrixCell>
    <MatrixCell label="Open (click trigger in preview)">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        Стихов за урок
        <TermHint term={glossary.verses_per_lesson.term} hint={glossary.verses_per_lesson.hint} />
      </span>
    </MatrixCell>
    <MatrixCell label="Long hint text">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        Длинный термин
        <TermHint term="Длинный термин" hint={longHint} />
      </span>
    </MatrixCell>
    <MatrixCell label="Focus visible (Tab to ?)">
      <TermHint term={glossary.test.term} hint={glossary.test.hint} />
    </MatrixCell>
    <MatrixCell label="Touch target (< md, 44 px)">
      <TermHint term={glossary.bricks.term} hint={glossary.bricks.hint} />
    </MatrixCell>
    <MatrixCell label={`Glossary (${termHintLabSection.id})`}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {GLOSSARY_TERM_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-1 text-sm text-muted-foreground">
            <span>{glossary[key].term}</span>
            <TermHint term={glossary[key].term} hint={glossary[key].hint} />
          </li>
        ))}
      </ul>
    </MatrixCell>
  </div>
);
