"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLE, type MutationResult } from "@sunschool/domain";
import { createCalendarEvent } from "@/data/calendar/create-event";
import { deleteCalendarEvent } from "@/data/calendar/delete-event";
import { updateCalendarEvent } from "@/data/calendar/update-event";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

const revalidateCalendar = () => {
  revalidatePath("/calendar");
};

export async function createCalendarEventAction(
  _prev: MutationResult<{ eventId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ eventId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const lessonRaw = String(formData.get("lessonId") ?? "").trim();
  const result = await createCalendarEvent(await getPrisma(), actor.userId, {
    gradeId: String(formData.get("gradeId") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    lessonId: lessonRaw.length > 0 ? lessonRaw : undefined,
  });
  if (result.ok) revalidateCalendar();
  return result;
}

export async function updateCalendarEventAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const lessonRaw = String(formData.get("lessonId") ?? "").trim();
  const result = await updateCalendarEvent(await getPrisma(), actor.userId, {
    eventId: String(formData.get("eventId") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    lessonId: lessonRaw.length > 0 ? lessonRaw : undefined,
  });
  if (result.ok) revalidateCalendar();
  return result;
}

export async function deleteCalendarEventAction(
  _prev: MutationResult | null,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const result = await deleteCalendarEvent(await getPrisma(), actor.userId, {
    eventId: String(formData.get("eventId") ?? ""),
  });
  if (result.ok) revalidateCalendar();
  return result;
}
