import { MUTATION_ERROR_CODES, USER_ROLE, type TeacherFamilyAdultContact } from "@sunschool/domain";
import { isMutationErr } from "@/data/access/access-admin-guards.server";
import { notFound } from "next/navigation";
import { StatusText } from "@/components/ui/status-text";
import { SectionTitle } from "@/components/atoms/SectionTitle";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import { listFamilyContacts } from "@/data/families/list-family-contacts";
import { readFeaturesParentsEnabled } from "@/data/families/family-feature.server";
import { getPrisma } from "@/lib/db.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { fillMessage } from "@/lib/messages/fill-message";
import { getDictionary } from "@/lib/messages/get-dictionary";
import { pickTeacherFamilyMessages } from "@/lib/messages/pick-teacher-family-messages.server";

type TeacherPupilFamilyContactsCardProps = {
  actorUserId: string;
  actorRoles: readonly string[];
  pupilId: string;
};

const formatAdultLine = (
  adult: TeacherFamilyAdultContact,
  relationLabels: Record<string, string>,
): string => {
  const name = formatDisplayName(adult);
  const relation = relationLabels[adult.relation] ?? adult.relation;
  const phonePart = adult.phones.length > 0 ? ` · ${adult.phones.join(" · ")}` : "";
  return `${name} · ${relation}${phonePart}`;
};

export const TeacherPupilFamilyContactsCard = async ({
  actorUserId,
  actorRoles,
  pupilId,
}: TeacherPupilFamilyContactsCardProps) => {
  const db = await getPrisma();
  const parentsEnabled = await db.$transaction((tx) => readFeaturesParentsEnabled(tx));
  if (!parentsEnabled) return null;

  const locale = await getUiLocale();
  const teacherDict = await getDictionary(locale, "teacher");
  const messages = pickTeacherFamilyMessages(teacherDict);

  const contactsResult = await listFamilyContacts(db, actorUserId, pupilId);
  if (isMutationErr(contactsResult)) {
    if (
      contactsResult.code === MUTATION_ERROR_CODES.NOT_FOUND ||
      contactsResult.code === MUTATION_ERROR_CODES.FORBIDDEN
    ) {
      notFound();
    }
    return null;
  }

  const pupil = await db.pupil.findFirst({
    where: { id: pupilId },
    select: {
      familyId: true,
      family: { select: { id: true, name: true } },
    },
  });

  if (!pupil?.familyId || !pupil.family) {
    return (
      <StatusText tone="warn" className="mb-4 block text-base">
        {messages.noFamily}
      </StatusText>
    );
  }

  const isAdmin = actorRoles.includes(USER_ROLE.ADMIN);
  const { family } = pupil;
  const adults = contactsResult.data.adults;

  return (
    <section className="mb-4" aria-labelledby="pupil-family-contacts-heading">
      <Card className="p-4">
        <SectionTitle as="h2" id="pupil-family-contacts-heading" className="font-medium">
          {isAdmin ? (
            <>
              {messages.sectionTitlePrefix}{" "}
              <CustomLink href={`/family?id=${family.id}`} aria-label={messages.adminFamilyLinkLabel}>
                {family.name}
              </CustomLink>
            </>
          ) : (
            fillMessage(messages.sectionTitle, { name: family.name })
          )}
        </SectionTitle>
        {adults.length > 0 ? (
          <ul className="mt-1 space-y-1 text-sm text-ink-2">
            {adults.map((adult) => (
              <li key={adult.adultId}>{formatAdultLine(adult, messages.relationLabels)}</li>
            ))}
          </ul>
        ) : null}
      </Card>
    </section>
  );
};
