import { AlertText } from "@/components/atoms/AlertText";
import { ContentText } from "@/components/atoms/ContentText";
import { Heading } from "@/components/atoms/Heading";
import { NumberDisplay } from "@/components/atoms/NumberDisplay";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { TYPE_SCALE } from "@/lib/design-lab/tokens";
import { cn } from "@/lib/utils";

const ATOM_ROWS = [
  { label: "Heading · page", node: <Heading level="page">Заголовок страницы</Heading> },
  { label: "Heading · section", node: <Heading level="section" as="h2">Заголовок секции</Heading> },
  { label: "Heading · hero", node: <Heading level="hero">Hero входа</Heading> },
  { label: "SectionTitle", node: <SectionTitle>SectionTitle</SectionTitle> },
  { label: "ContentText · body", node: <ContentText>Основной текст</ContentText> },
  { label: "ContentText · muted", node: <ContentText tone="muted">Подпись</ContentText> },
  { label: "NumberDisplay · kpi", node: <NumberDisplay size="kpi">42</NumberDisplay> },
  { label: "NumberDisplay · score", node: <NumberDisplay size="score">128</NumberDisplay> },
  { label: "AlertText · error", node: <AlertText>Ошибка поля</AlertText> },
] as const;

export const TypeScale = () => (
  <div className="space-y-8">
    <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
      {TYPE_SCALE.map((row) => (
        <li key={row.role} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6">
          <div className="w-44 shrink-0 text-sm text-muted">
            {row.role}
            <span className="block tabular-nums">{row.spec}</span>
          </div>
          <p className={cn("min-w-0 text-ink", row.classes)}>{row.sample}</p>
        </li>
      ))}
    </ul>
    <div>
      <p className="mb-3 text-sm font-medium text-ink-2">L1 atoms (`@/components/atoms`)</p>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {ATOM_ROWS.map((row) => (
          <li key={row.label} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
            <span className="w-44 shrink-0 text-sm text-muted">{row.label}</span>
            <div className="min-w-0">{row.node}</div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
