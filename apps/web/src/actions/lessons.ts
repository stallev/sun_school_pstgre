"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { changeLeadTeacher } from "@/data/lessons/change-lead-teacher";
import { createLesson } from "@/data/lessons/create-lesson";
import { deleteLesson } from "@/data/lessons/delete-lesson";
import { updateLesson } from "@/data/lessons/update-lesson";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";
import { sanitizeLessonBody } from "@/lib/lesson/sanitize-lesson-body";

const revalidateLessonSurfaces = (lessonId?: string) => {
  revalidatePath("/lessons");
  revalidatePath("/today");
  revalidatePath("/calendar");
  if (lessonId) {
    revalidatePath(`/lessons/${lessonId}`);
    revalidatePath(`/lessons/${lessonId}/edit`);
  }
};

export async function createLessonAction(
  _prev: MutationResult<{ lessonId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ lessonId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const versesRaw = String(formData.get("versesJson") ?? "[]");
  let verses: unknown[] = [];
  try {
    verses = JSON.parse(versesRaw) as unknown[];
  } catch {
    verses = [];
  }
  const result = await createLesson(await getPrisma(), actor.userId, {
    gradeId: String(formData.get("gradeId") ?? ""),
    title: String(formData.get("title") ?? ""),
    lessonDate: String(formData.get("lessonDate") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    leadTeacherId: String(formData.get("leadTeacherId") ?? ""),
    body: sanitizeLessonBody(String(formData.get("body") ?? "")),
    hasTest: formData.get("hasTest") === "on" || formData.get("hasTest") === "true",
    verses,
  });
  if (result.ok) revalidateLessonSurfaces(result.data.lessonId);
  return result;
}

export async function updateLessonAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const versesRaw = String(formData.get("versesJson") ?? "[]");
  let verses: unknown[] = [];
  try {
    verses = JSON.parse(versesRaw) as unknown[];
  } catch {
    verses = [];
  }
  const lessonId = String(formData.get("lessonId") ?? "");
  const result = await updateLesson(await getPrisma(), actor.userId, {
    lessonId,
    title: String(formData.get("title") ?? ""),
    lessonDate: String(formData.get("lessonDate") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    leadTeacherId: String(formData.get("leadTeacherId") ?? ""),
    body: sanitizeLessonBody(String(formData.get("body") ?? "")),
    hasTest: formData.get("hasTest") === "on" || formData.get("hasTest") === "true",
    verses,
  });
  if (result.ok) revalidateLessonSurfaces(lessonId);
  return result;
}

export async function changeLeadTeacherAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const lessonId = String(formData.get("lessonId") ?? "");
  const result = await changeLeadTeacher(await getPrisma(), actor.userId, {
    lessonId,
    leadTeacherId: String(formData.get("leadTeacherId") ?? ""),
  });
  if (result.ok) revalidateLessonSurfaces(lessonId);
  return result;
}

export async function deleteLessonAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const lessonId = String(formData.get("lessonId") ?? "");
  const result = await deleteLesson(await getPrisma(), actor.userId, { lessonId });
  if (result.ok) revalidateLessonSurfaces();
  return result;
}
