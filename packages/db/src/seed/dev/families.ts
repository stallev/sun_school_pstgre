/**
 * Families, parent account, consents and weekly digest for P13 UI (seed_data_spec §8.4).
 * Runs only inside `db:seed:dev` after the main fixture rows exist.
 */
import {
  ACCOUNT_STATUS,
  ADULT_RELATION,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  CONSENT_TYPE,
  LOGIN_PROVIDER,
  USER_ROLE,
  emptyWeeklyDigestPayload,
} from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { hashPassword } from "../../auth/password";
import type { Prisma } from "../../generated/prisma/client";
import type { SeedTx } from "../reference/types";
import { APP_SETTING_DEFAULTS } from "../reference/app-settings";
import { deterministicUuid } from "./fixture";

export const FEATURES_PARENTS_KEY = "features.parents";
const CHILD_CONSENT_TEXT_VERSION_KEY = "child_data_consent_text_version";
const CHILD_CONSENT_TEXT_VERSION_DEFAULT = "v1";
const CONSENT_TEXT_VERSION_KEY = "consent_text_version";
const FIXTURE_PARENT_USER_KEY = "fixture-parent";
const FAMILY_PARENT_HOME_KEY = "family:parent-home";
const FAMILY_SECOND_HOME_KEY = "family:second-home";
const MOTHER_ADULT_KEY = "adult:fixture-mother";
const FATHER_ADULT_KEY = "adult:fixture-father";
const GUARDIAN_ADULT_KEY = "adult:fixture-guardian";
const PARENT_CHILD_PUPIL_KEY = "a2";
const SECOND_FAMILY_PUPIL_KEY = "b1";
const DIGEST_PERIOD_START = "2026-10-19";

const DEV_PARENT_LAST_NAME = "Фикстура";
const DEV_PARENT_FIRST_NAME = "Родитель";

const id = (name: string): string => deterministicUuid(name);
const date = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

export type ParentSeedInput = { email: string; password: string };

async function readTextVersion(tx: SeedTx, key: string): Promise<string | null> {
  const row = await tx.appSetting.findUnique({ where: { key } });
  return typeof row?.value === "string" && row.value.length > 0 ? row.value : null;
}

export async function replaceDevFamilies(tx: SeedTx): Promise<void> {
  const parentUserId = id(`user:${FIXTURE_PARENT_USER_KEY}`);
  await tx.weeklyDigest.deleteMany({ where: { userId: parentUserId } });
  const familyIds = [id(FAMILY_PARENT_HOME_KEY), id(FAMILY_SECOND_HOME_KEY)];
  const pupilIds = [id(`pupil:${PARENT_CHILD_PUPIL_KEY}`), id(`pupil:${SECOND_FAMILY_PUPIL_KEY}`)];

  const adultIds = [id(MOTHER_ADULT_KEY), id(FATHER_ADULT_KEY), id(GUARDIAN_ADULT_KEY)];
  await tx.childDataConsent.deleteMany({
    where: { OR: [{ pupilId: { in: pupilIds } }, { guardianAdultId: { in: adultIds } }] },
  });
  await tx.pupil.updateMany({ where: { id: { in: pupilIds } }, data: { familyId: null } });
  await tx.familyAdult.deleteMany({ where: { familyId: { in: familyIds } } });
  await tx.family.deleteMany({ where: { id: { in: familyIds } } });

  const parentIdentity = await tx.loginIdentity.findFirst({
    where: { userId: parentUserId },
    select: { id: true },
  });
  if (parentIdentity) {
    await tx.loginIdentity.delete({ where: { id: parentIdentity.id } });
  }
  await tx.privacyConsent.deleteMany({ where: { userId: parentUserId } });
  await tx.userRoleAssignment.deleteMany({ where: { userId: parentUserId } });
  await tx.appUser.deleteMany({ where: { id: parentUserId } });

  await tx.appSetting.updateMany({
    where: { key: FEATURES_PARENTS_KEY },
    data: { value: APP_SETTING_DEFAULTS[FEATURES_PARENTS_KEY] as Prisma.InputJsonValue },
  });
}

async function ensureParentUser(
  tx: SeedTx,
  organizationId: string,
  input: ParentSeedInput,
  consentVersion: string,
): Promise<string> {
  const userId = id(`user:${FIXTURE_PARENT_USER_KEY}`);
  const passwordHash = await hashPassword(input.password);
  const existing = await tx.loginIdentity.findUnique({
    where: {
      provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: input.email },
    },
    select: { userId: true },
  });
  if (existing) {
    if (existing.userId !== userId) {
      throw new Error("PARENT_EMAIL belongs to another user; use the email from the first seed:dev run");
    }
    await tx.loginIdentity.update({
      where: {
        provider_providerAccountId: { provider: LOGIN_PROVIDER.CREDENTIALS, providerAccountId: input.email },
      },
      data: { passwordHash, failedAttempts: 0, lockedUntil: null },
    });
    return userId;
  }

  const now = new Date();
  await tx.appUser.create({
    data: {
      id: userId,
      organizationId,
      status: ACCOUNT_STATUS.ACTIVE,
      email: input.email,
      lastName: DEV_PARENT_LAST_NAME,
      firstName: DEV_PARENT_FIRST_NAME,
      firstLoginAt: now,
      roles: { create: { role: USER_ROLE.PARENT } },
    },
  });
  const identity = await tx.loginIdentity.create({
    data: {
      userId,
      provider: LOGIN_PROVIDER.CREDENTIALS,
      providerAccountId: input.email,
      email: input.email,
      passwordHash,
    },
  });
  await tx.privacyConsent.create({
    data: { userId, textVersion: consentVersion, acceptedAt: now, type: CONSENT_TYPE.PD_PROCESSING },
  });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.LOGIN_IDENTITY,
    entityId: identity.id,
    action: AUDIT_ACTION.AUTH_PASSWORD_SET,
  });
  return userId;
}

export type DevFamiliesSeedReport = { skipped: boolean; families: number };

export async function seedDevFamiliesInTx(tx: SeedTx, parentInput: ParentSeedInput): Promise<DevFamiliesSeedReport> {
  const marker = await tx.family.findUnique({ where: { id: id(FAMILY_PARENT_HOME_KEY) }, select: { id: true } });
  if (marker) return { skipped: true, families: 0 };

  const organization = await tx.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organization) throw new Error("No organization: run db:seed:reference first");

  const consentVersion = await readTextVersion(tx, CONSENT_TEXT_VERSION_KEY);
  if (!consentVersion) throw new Error("No consent_text_version: run db:seed:reference first");
  const childConsentVersion =
    (await readTextVersion(tx, CHILD_CONSENT_TEXT_VERSION_KEY)) ?? CHILD_CONSENT_TEXT_VERSION_DEFAULT;

  const admin = await tx.userRoleAssignment.findFirst({
    where: { role: USER_ROLE.ADMIN },
    select: { userId: true },
  });
  const markedById = admin?.userId;
  if (!markedById) throw new Error("No administrator to mark consents");

  const parentUserId = await ensureParentUser(tx, organization.id, parentInput, consentVersion);
  const parentFamilyId = id(FAMILY_PARENT_HOME_KEY);
  const secondFamilyId = id(FAMILY_SECOND_HOME_KEY);
  const motherAdultId = id(MOTHER_ADULT_KEY);
  const fatherAdultId = id(FATHER_ADULT_KEY);
  const guardianAdultId = id(GUARDIAN_ADULT_KEY);
  const parentChildId = id(`pupil:${PARENT_CHILD_PUPIL_KEY}`);
  const secondChildId = id(`pupil:${SECOND_FAMILY_PUPIL_KEY}`);

  await tx.family.createMany({
    data: [
      { id: parentFamilyId, organizationId: organization.id, name: "Семья фикстуры (родитель)" },
      { id: secondFamilyId, organizationId: organization.id, name: "Семья фикстуры (вторая)" },
    ],
  });
  await tx.familyAdult.createMany({
    data: [
      {
        id: motherAdultId,
        familyId: parentFamilyId,
        lastName: "Иванова",
        firstName: "Мария",
        relation: ADULT_RELATION.MOTHER,
        phones: [{ label: "моб.", number: "+7-900-000-00-01" }],
        email: parentInput.email,
        userId: parentUserId,
      },
      {
        id: fatherAdultId,
        familyId: parentFamilyId,
        lastName: "Иванов",
        firstName: "Пётр",
        relation: ADULT_RELATION.FATHER,
        phones: [{ label: "моб.", number: "+7-900-000-00-02" }],
      },
      {
        id: guardianAdultId,
        familyId: secondFamilyId,
        lastName: "Смирнова",
        firstName: "Ольга",
        relation: ADULT_RELATION.MOTHER,
        phones: [{ label: "дом.", number: "+7-900-000-00-03" }],
      },
    ],
  });
  await tx.pupil.update({ where: { id: parentChildId }, data: { familyId: parentFamilyId } });
  await tx.pupil.update({ where: { id: secondChildId }, data: { familyId: secondFamilyId } });

  await tx.childDataConsent.create({
    data: {
      pupilId: parentChildId,
      guardianAdultId: motherAdultId,
      channel: CONSENT_CHANNEL.ELECTRONIC,
      textVersion: childConsentVersion,
      signedOn: date("2026-09-15"),
      markedById,
      status: CONSENT_STATUS.ACTIVE,
    },
  });
  await tx.childDataConsent.create({
    data: {
      pupilId: secondChildId,
      guardianAdultId: guardianAdultId,
      channel: CONSENT_CHANNEL.PAPER,
      textVersion: childConsentVersion,
      signedOn: date("2026-08-20"),
      paperStorageNote: "Папка фикстуры",
      markedById,
      status: CONSENT_STATUS.ACTIVE,
    },
  });

  await tx.weeklyDigest.create({
    data: {
      id: id("weekly-digest:fixture-parent"),
      userId: parentUserId,
      periodStart: date(DIGEST_PERIOD_START),
      payload: emptyWeeklyDigestPayload() as Prisma.InputJsonValue,
      sentAt: null,
    },
  });

  await tx.appSetting.upsert({
    where: { key: FEATURES_PARENTS_KEY },
    create: { key: FEATURES_PARENTS_KEY, value: true },
    update: { value: true },
  });

  return { skipped: false, families: 2 };
}
