"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { ADULT_RELATION, CONSENT_CHANNEL } from "@sunschool/domain";
import { useAdminMessages } from "@/components/admin/admin-messages-provider.client";
import {
  addFamilyAdultAction,
  attachFamilyPupilAction,
  detachFamilyPupilAction,
  removeFamilyAdultAction,
  updateFamilyAdultAction,
  upsertFamilyAction,
} from "@/actions/families";
import { ConsentDialog } from "@/components/admin/ConsentDialog";
import { ContentText, SectionTitle } from "@/components/atoms";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomLink } from "@/components/ui/custom-link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusText } from "@/components/ui/status-text";
import type {
  AttachPupilOption,
  FamilyAdminDetail,
} from "@/data/families/load-families-admin.server";
import { useAdminFormMutation } from "@/lib/admin/use-admin-form-mutation";
import type { FamilyAdminMessages } from "@/lib/messages/pick-family-admin-messages.server";
import type { MessageLocale } from "@/lib/messages/dictionary-types";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import { getAccountStatusStMetaTone } from "@/lib/admin/account-status-tone";
import { formatAccountStatusLabel } from "@/lib/admin/format-account-status-label";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

type FamilyDetailBoardProps = {
  detail: FamilyAdminDetail;
  attachOptions: AttachPupilOption[];
  messages: FamilyAdminMessages;
  dictionaries: Record<string, Dictionary>;
  uiLocale: MessageLocale;
  consentTextVersion: string;
  defaultSignedOn: string;
  createdLabel: string;
  journalSlot: ReactNode;
};

const RelationRadios = ({
  name,
  value,
  messages,
  disabled,
}: {
  name: string;
  value: string;
  messages: FamilyAdminMessages;
  disabled: boolean;
}) => (
  <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={messages.fieldRelation}>
    {[ADULT_RELATION.MOTHER, ADULT_RELATION.FATHER, ADULT_RELATION.GUARDIAN].map((relation) => (
      <label
        key={relation}
        className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-input text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-surface"
      >
        <input
          type="radio"
          name={name}
          value={relation}
          defaultChecked={value === relation}
          className="sr-only"
          disabled={disabled}
        />
        {messages.relationLabels[relation]}
      </label>
    ))}
  </div>
);

export const FamilyDetailBoard = ({
  detail,
  attachOptions,
  messages,
  dictionaries,
  uiLocale,
  consentTextVersion,
  defaultSignedOn,
  createdLabel,
  journalSlot,
}: FamilyDetailBoardProps) => {
  const adminMessages = useAdminMessages();
  const [editFamilyOpen, setEditFamilyOpen] = useState(false);
  const [adultDialog, setAdultDialog] = useState<{ mode: "add" | "edit"; adultId?: string } | null>(
    null,
  );
  const [childOpen, setChildOpen] = useState(false);

  const [familyState, familyAction, familyPending] = useActionState(upsertFamilyAction, null);
  const [addAdultState, addAdultAction, addAdultPending] = useActionState(addFamilyAdultAction, null);
  const [updateAdultState, updateAdultAction, updateAdultPending] = useActionState(
    updateFamilyAdultAction,
    null,
  );
  const adultPending = adultDialog?.mode === "edit" ? updateAdultPending : addAdultPending;
  const [attachState, attachAction, attachPending] = useActionState(attachFamilyPupilAction, null);
  const [removeAdultState, removeAdultAction, removeAdultPending] = useActionState(
    removeFamilyAdultAction,
    null,
  );
  const [detachState, detachAction, detachPending] = useActionState(detachFamilyPupilAction, null);

  useAdminFormMutation({
    state: familyState,
    dictionaries,
    successMessage: messages.toastSaved,
    formErrorFallback: messages.formError,
    onSuccess: () => setEditFamilyOpen(false),
  });
  useAdminFormMutation({
    state: addAdultState,
    dictionaries,
    successMessage: messages.toastAdultSaved,
    formErrorFallback: messages.formError,
    onSuccess: () => setAdultDialog(null),
  });
  useAdminFormMutation({
    state: updateAdultState,
    dictionaries,
    successMessage: messages.toastAdultSaved,
    formErrorFallback: messages.formError,
    onSuccess: () => setAdultDialog(null),
  });
  useAdminFormMutation({
    state: attachState,
    dictionaries,
    successMessage: messages.toastChildAttached,
    formErrorFallback: messages.formError,
    onSuccess: () => setChildOpen(false),
  });
  useAdminFormMutation({
    state: removeAdultState,
    dictionaries,
    successMessage: messages.toastAdultRemoved,
    formErrorFallback: messages.formError,
  });
  useAdminFormMutation({
    state: detachState,
    dictionaries,
    successMessage: messages.toastChildDetached,
    formErrorFallback: messages.formError,
  });

  const editingAdult =
    adultDialog?.mode === "edit"
      ? detail.adults.find((row) => row.adultId === adultDialog.adultId)
      : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.name}
        description={createdLabel}
        actions={
          <div className="flex flex-wrap gap-2">
            <CustomLink href="/family" className="min-h-11">
              {messages.backToList}
            </CustomLink>
            <Button type="button" variant="outline" className="min-h-11 gap-1" onClick={() => setEditFamilyOpen(true)}>
              <PencilIcon className="size-4" aria-hidden />
              {messages.editAction}
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle>{messages.sectionAdults}</SectionTitle>
              <Button type="button" variant="ghost" className="h-9 px-2.5 text-sm" onClick={() => setAdultDialog({ mode: "add" })}>
                + {messages.addAdult}
              </Button>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {detail.adults.length === 0 ? (
                <li className="py-3 text-sm text-warn">{messages.adultsEmptyWarn}</li>
              ) : (
                detail.adults.map((adult) => (
                  <li key={adult.adultId} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {adult.displayName}{" "}
                        <span className="font-normal text-muted">
                          · {messages.relationLabels[adult.relation] ?? adult.relation}
                        </span>
                      </p>
                      <p className="text-sm text-ink-2">
                        {[adult.phones.join(", "), adult.email].filter(Boolean).join(" · ") ||
                          messages.noContacts}
                      </p>
                      <p className="mt-0.5 text-sm">
                        {adult.userId && adult.accountStatus ? (
                          <>
                            <StatusText
                              tone={getAccountStatusStMetaTone(adult.accountStatus)}
                              className="inline"
                            >
                              {formatAccountStatusLabel(adult.accountStatus, adminMessages)}
                            </StatusText>
                            {" "}
                            <CustomLink href={`/users/${adult.userId}`} className="text-cobalt-ink">
                              {messages.userProfileLink}
                            </CustomLink>
                          </>
                        ) : (
                          <span className="text-muted">{messages.noAccountHint}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label={messages.editAdult}
                        onClick={() => setAdultDialog({ mode: "edit", adultId: adult.adultId })}
                      >
                        <PencilIcon className="size-4" aria-hidden />
                      </Button>
                      <form action={removeAdultAction} className="inline">
                        <input type="hidden" name="adultId" value={adult.adultId} />
                        <input type="hidden" name="familyId" value={detail.familyId} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="size-9 text-ink-2 hover:bg-danger-soft hover:text-danger"
                          aria-label={messages.removeAdult}
                          disabled={removeAdultPending}
                          aria-busy={removeAdultPending}
                        >
                          <XIcon className="size-4" aria-hidden />
                        </Button>
                      </form>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionTitle>{messages.sectionChildren}</SectionTitle>
              <Button type="button" variant="ghost" className="h-9 px-2.5 text-sm" onClick={() => setChildOpen(true)}>
                + {messages.addChild}
              </Button>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {detail.children.length === 0 ? (
                <li className="py-3 text-sm text-warn">{messages.childrenEmptyWarn}</li>
              ) : (
                detail.children.map((child) => {
                  const consentLabel = child.consent.hasActiveConsent
                    ? child.consent.channel === CONSENT_CHANNEL.PAPER
                      ? messages.consentOkPaper.replace("{by}", child.consent.grantedByLabel ?? "—")
                      : messages.consentOkElectronic.replace("{by}", child.consent.grantedByLabel ?? "—")
                    : messages.consentMissing;
                  return (
                    <li key={child.pupilId} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <CustomLink href={`/analytics/pupils/${child.pupilId}`} className="font-medium text-cobalt-ink">
                          {child.displayName}
                        </CustomLink>
                        <p className="text-sm text-muted">{child.groupName ?? "—"}</p>
                        <StatusText
                          tone={child.consent.hasActiveConsent ? "ok" : "warn"}
                          className="mt-0.5 block text-sm"
                        >
                          {consentLabel}
                        </StatusText>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {!child.consent.hasActiveConsent ? (
                          <ConsentDialog
                            pupilId={child.pupilId}
                            displayName={child.displayName}
                            consentTextVersion={consentTextVersion}
                            defaultSignedOn={defaultSignedOn}
                            dictionaries={dictionaries}
                            uiLocale={uiLocale}
                            formError={messages.formError}
                            closeLabel={messages.closeLabel}
                          />
                        ) : null}
                        <form action={detachAction} className="inline">
                          <input type="hidden" name="pupilId" value={child.pupilId} />
                          <input type="hidden" name="familyId" value={detail.familyId} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="size-9 text-ink-2 hover:bg-danger-soft hover:text-danger"
                            aria-label={messages.removeChild}
                            disabled={detachPending}
                            aria-busy={detachPending}
                          >
                            <XIcon className="size-4" aria-hidden />
                          </Button>
                        </form>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="px-4 py-2 sm:px-5">
            <dl className="divide-y divide-line">
              {[
                [messages.metaAddress, detail.address ?? "—"],
                [messages.metaNote, detail.note ?? "—"],
                [messages.metaTeacherVisibility, messages.metaTeacherVisibilityValue],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                  <dt className="w-32 shrink-0 text-sm text-muted">{label}</dt>
                  <dd className="min-w-0 text-sm text-ink-2">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-4 sm:p-5">{journalSlot}</Card>
        </div>
      </div>

      <Dialog open={editFamilyOpen} onOpenChange={setEditFamilyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.dialogFamilyEdit}</DialogTitle>
          </DialogHeader>
          <form action={familyAction} className="mt-5 space-y-4" aria-busy={familyPending}>
            <input type="hidden" name="familyId" value={detail.familyId} />
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldName}</span>
              <Input name="name" required disabled={familyPending} defaultValue={detail.name} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldAddress}</span>
              <Input name="address" disabled={familyPending} defaultValue={detail.address ?? ""} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldNote}</span>
              <Input name="note" disabled={familyPending} defaultValue={detail.note ?? ""} />
            </label>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={familyPending} />}>
                {messages.cancelLabel}
              </DialogClose>
              <Button type="submit" disabled={familyPending} aria-busy={familyPending} className={FORM_SUBMIT_BUTTON_CLASS}>
                {familyPending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : messages.saveSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adultDialog !== null} onOpenChange={(open) => !open && setAdultDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adultDialog?.mode === "edit" ? messages.dialogAdultEdit : messages.dialogAdultCreate}
            </DialogTitle>
            <DialogDescription>{messages.dialogAdultHint}</DialogDescription>
          </DialogHeader>
          <form
            action={adultDialog?.mode === "edit" ? updateAdultAction : addAdultAction}
            className="mt-5 space-y-4"
            aria-busy={adultPending}
          >
            <input type="hidden" name="familyId" value={detail.familyId} />
            {editingAdult ? <input type="hidden" name="adultId" value={editingAdult.adultId} /> : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span>{messages.lastName}</span>
                <Input name="lastName" required disabled={adultPending} defaultValue={editingAdult?.lastName ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{messages.firstName}</span>
                <Input name="firstName" required disabled={adultPending} defaultValue={editingAdult?.firstName ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span>{messages.middleName}</span>
                <Input name="middleName" disabled={adultPending} defaultValue={editingAdult?.middleName ?? ""} />
              </label>
            </div>
            <RelationRadios
              name="relation"
              value={editingAdult?.relation ?? ADULT_RELATION.MOTHER}
              messages={messages}
              disabled={adultPending}
            />
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldPhones}</span>
              <Input
                name="phones"
                disabled={adultPending}
                defaultValue={editingAdult?.phones.join(", ") ?? ""}
                placeholder={messages.fieldPhonesHint}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>{messages.fieldEmail}</span>
              <Input name="email" type="email" disabled={adultPending} defaultValue={editingAdult?.email ?? ""} />
            </label>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={adultPending} />}>
                {messages.cancelLabel}
              </DialogClose>
              <Button type="submit" disabled={adultPending} aria-busy={adultPending} className={FORM_SUBMIT_BUTTON_CLASS}>
                {adultPending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : messages.saveSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={childOpen} onOpenChange={setChildOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.dialogChildAdd}</DialogTitle>
            <DialogDescription>{messages.dialogChildAddHint}</DialogDescription>
          </DialogHeader>
          <form action={attachAction} className="mt-5 space-y-4" aria-busy={attachPending}>
            <input type="hidden" name="familyId" value={detail.familyId} />
            {attachOptions.length === 0 ? (
              <ContentText tone="secondary">{messages.dialogChildEmpty}</ContentText>
            ) : (
              <div className="space-y-1 rounded-lg border border-line p-2">
                {attachOptions.map((option) => (
                  <label key={option.pupilId} className="flex items-center gap-2 py-1">
                    <input type="radio" name="pupilId" value={option.pupilId} className="size-4 accent-primary" required />
                    {option.displayName}{" "}
                    <span className="text-sm text-muted">· {option.groupName ?? "—"}</span>
                  </label>
                ))}
              </div>
            )}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={attachPending} />}>
                {messages.cancelLabel}
              </DialogClose>
              <Button
                type="submit"
                disabled={attachPending || attachOptions.length === 0}
                aria-busy={attachPending}
                className={FORM_SUBMIT_BUTTON_CLASS}
              >
                {attachPending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : messages.addSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
