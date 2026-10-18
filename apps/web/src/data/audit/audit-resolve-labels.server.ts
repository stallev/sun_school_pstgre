import "server-only";

import { AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatAppUserDisplayName, formatDisplayName } from "@/lib/person/format-display-name";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getMessage } from "@/lib/messages/get-dictionary";
import type { RawAuditRow } from "./audit-shared.server";
import { isKnownEntityType } from "./audit-shared.server";

type LabelContext = {
  deletedUserTemplate: string;
  systemActorLabel: string;
  pupilErasedLabel: string;
  entityTypeLabels: Record<string, string>;
};

const shortId = (id: string): string => id.slice(0, 8);

function entityTypeLabel(ctx: LabelContext, type: string): string {
  return ctx.entityTypeLabels[type] ?? type;
}

export async function resolveAuditEntryLabels(
  db: PrismaClient,
  rows: RawAuditRow[],
  adminDict: Dictionary,
  commonDict: Dictionary,
): Promise<Map<string, { actorLabel: string; entityLabel: string; entityHref: string | null }>> {
  const ctx: LabelContext = {
    deletedUserTemplate: getMessage(commonDict, "person.deleted_user"),
    systemActorLabel: getMessage(adminDict, "audit.system_actor"),
    pupilErasedLabel: getMessage(adminDict, "audit.entity_pupil_erased"),
    entityTypeLabels: Object.fromEntries(
      Object.values(AUDIT_ENTITY_TYPE).map((type) => [
        type,
        safeAdminMessage(adminDict, `audit.entity_types.${type}`) ?? type,
      ]),
    ),
  };

  const actorIds = [...new Set(rows.map((row) => row.actorUserId).filter(Boolean))] as string[];
  const actors = actorIds.length
    ? await db.appUser.findMany({
        where: { id: { in: actorIds } },
        select: {
          id: true,
          status: true,
          deletedOrdinal: true,
          firstName: true,
          lastName: true,
          middleName: true,
        },
      })
    : [];
  const actorMap = new Map(
    actors.map((user) => [
      user.id,
      formatAppUserDisplayName(user, ctx.deletedUserTemplate) ||
        entityTypeLabel(ctx, AUDIT_ENTITY_TYPE.APP_USER),
    ]),
  );

  const byType = groupEntityIds(rows);
  const entityLabels = await loadEntityLabels(db, byType, ctx);

  const result = new Map<string, { actorLabel: string; entityLabel: string; entityHref: string | null }>();
  for (const row of rows) {
    const actorLabel =
      row.source === AUDIT_SOURCE.SYSTEM || !row.actorUserId
        ? ctx.systemActorLabel
        : (actorMap.get(row.actorUserId) ?? entityTypeLabel(ctx, AUDIT_ENTITY_TYPE.APP_USER));
    const entityKey = `${row.entityType}:${row.entityId}`;
    const entity = entityLabels.get(entityKey) ?? {
      label: `${entityTypeLabel(ctx, row.entityType)} (${shortId(row.entityId)})`,
      href: null,
    };
    result.set(row.id, { actorLabel, entityLabel: entity.label, entityHref: entity.href });
  }
  return result;
}

function safeAdminMessage(adminDict: Dictionary, path: string): string | null {
  try {
    return getMessage(adminDict, path);
  } catch {
    return null;
  }
}

function groupEntityIds(rows: RawAuditRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!isKnownEntityType(row.entityType)) continue;
    const set = map.get(row.entityType) ?? new Set<string>();
    set.add(row.entityId);
    map.set(row.entityType, set);
  }
  return map;
}

async function loadEntityLabels(
  db: PrismaClient,
  byType: Map<string, Set<string>>,
  ctx: LabelContext,
): Promise<Map<string, { label: string; href: string | null }>> {
  const out = new Map<string, { label: string; href: string | null }>();

  const userIds = byType.get(AUDIT_ENTITY_TYPE.APP_USER);
  if (userIds?.size) {
    const users = await db.appUser.findMany({
      where: { id: { in: [...userIds] } },
      select: {
        id: true,
        status: true,
        deletedOrdinal: true,
        firstName: true,
        lastName: true,
        middleName: true,
      },
    });
    for (const user of users) {
      const label =
        formatAppUserDisplayName(user, ctx.deletedUserTemplate) ||
        entityTypeLabel(ctx, AUDIT_ENTITY_TYPE.APP_USER);
      out.set(`${AUDIT_ENTITY_TYPE.APP_USER}:${user.id}`, { label, href: `/users/${user.id}` });
    }
    for (const id of userIds) {
      const key = `${AUDIT_ENTITY_TYPE.APP_USER}:${id}`;
      if (!out.has(key)) {
        out.set(key, { label: ctx.deletedUserTemplate.replace("{ordinal}", "?"), href: null });
      }
    }
  }

  const pupilIds = byType.get(AUDIT_ENTITY_TYPE.PUPIL);
  if (pupilIds?.size) {
    const pupils = await db.pupil.findMany({
      where: { id: { in: [...pupilIds] } },
      select: { id: true, firstName: true, lastName: true, middleName: true },
    });
    for (const pupil of pupils) {
      const label = formatDisplayName(pupil);
      out.set(`${AUDIT_ENTITY_TYPE.PUPIL}:${pupil.id}`, {
        label: label.length > 0 ? label : entityTypeLabel(ctx, AUDIT_ENTITY_TYPE.PUPIL),
        href: `/analytics/pupils/${pupil.id}`,
      });
    }
    for (const id of pupilIds) {
      const key = `${AUDIT_ENTITY_TYPE.PUPIL}:${id}`;
      if (!out.has(key)) out.set(key, { label: ctx.pupilErasedLabel, href: null });
    }
  }

  const gradeIds = byType.get(AUDIT_ENTITY_TYPE.GRADE);
  if (gradeIds?.size) {
    const grades = await db.grade.findMany({
      where: { id: { in: [...gradeIds] } },
      select: { id: true, name: true },
    });
    for (const grade of grades) {
      out.set(`${AUDIT_ENTITY_TYPE.GRADE}:${grade.id}`, {
        label: grade.name,
        href: `/groups/${grade.id}`,
      });
    }
  }

  const yearIds = byType.get(AUDIT_ENTITY_TYPE.ACADEMIC_YEAR);
  if (yearIds?.size) {
    const years = await db.academicYear.findMany({
      where: { id: { in: [...yearIds] } },
      select: { id: true, name: true },
    });
    for (const year of years) {
      out.set(`${AUDIT_ENTITY_TYPE.ACADEMIC_YEAR}:${year.id}`, {
        label: year.name,
        href: "/year",
      });
    }
  }

  const lessonIds = byType.get(AUDIT_ENTITY_TYPE.LESSON);
  if (lessonIds?.size) {
    const lessons = await db.lesson.findMany({
      where: { id: { in: [...lessonIds] } },
      select: { id: true, title: true },
    });
    for (const lesson of lessons) {
      out.set(`${AUDIT_ENTITY_TYPE.LESSON}:${lesson.id}`, {
        label: lesson.title,
        href: `/lessons/${lesson.id}`,
      });
    }
  }

  for (const [type, ids] of byType) {
    if (
      type === AUDIT_ENTITY_TYPE.APP_USER ||
      type === AUDIT_ENTITY_TYPE.PUPIL ||
      type === AUDIT_ENTITY_TYPE.GRADE ||
      type === AUDIT_ENTITY_TYPE.ACADEMIC_YEAR ||
      type === AUDIT_ENTITY_TYPE.LESSON
    ) {
      continue;
    }
    const typeLabel = entityTypeLabel(ctx, type);
    for (const id of ids) {
      out.set(`${type}:${id}`, { label: `${typeLabel} (${shortId(id)})`, href: null });
    }
  }

  return out;
}

export function resolveAuditActionLabel(adminDict: Dictionary, action: string): string {
  return safeAdminMessage(adminDict, `audit.actions.${action}`) ?? action;
}
