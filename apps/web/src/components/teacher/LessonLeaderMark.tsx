import { TrophyIcon } from "lucide-react";

type LessonLeaderMarkProps = {
  label: string;
};

/** Lesson leader marker: the gold fill is never the only signal (UX-03 D-16). */
export const LessonLeaderMark = ({ label }: LessonLeaderMarkProps) => (
  <span className="inline-flex shrink-0 items-center text-gold-ink">
    <TrophyIcon className="size-4" aria-hidden />
    <span className="sr-only">{label}</span>
  </span>
);
