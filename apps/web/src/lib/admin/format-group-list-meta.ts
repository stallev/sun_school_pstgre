import { formatGroupAgeRange } from "@/lib/admin/format-group-age-range";
import { fillMessage } from "@/lib/messages/fill-message";

type FormatGroupListMetaInput = {
  languageLabel: string;
  ageMin: number | null;
  ageMax: number | null;
  teacherLabel: string;
  ageRangeTemplate: string;
};

/** «Русский · 6–8 лет · 1 учитель» (P25-T8). */
export const formatGroupListMeta = ({
  languageLabel,
  ageMin,
  ageMax,
  teacherLabel,
  ageRangeTemplate,
}: FormatGroupListMetaInput): string => {
  const range = formatGroupAgeRange(ageMin, ageMax);
  const ageLabel = range ? fillMessage(ageRangeTemplate, { range }) : null;
  return [languageLabel, ageLabel, teacherLabel].filter(Boolean).join(" · ");
};
