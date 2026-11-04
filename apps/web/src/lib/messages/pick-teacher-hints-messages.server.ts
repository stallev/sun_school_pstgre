import "server-only";

import type { Dictionary } from "@/lib/messages/get-dictionary";
import { pickHintsMessages } from "@/lib/messages/pick-hints-messages";
import { TEACHER_HINT_KEYS, type TeacherHintKey } from "@/lib/messages/teacher-hints-types";

export type TeacherHintsMessages = ReturnType<typeof pickTeacherHintsMessages>;

export const pickTeacherHintsMessages = (teacher: Dictionary) =>
  pickHintsMessages(teacher, TEACHER_HINT_KEYS);

export const pickTeacherHintsSubset = <const K extends readonly TeacherHintKey[]>(
  teacher: Dictionary,
  keys: K,
) => pickHintsMessages(teacher, keys);
