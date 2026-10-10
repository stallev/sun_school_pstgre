"use client";

import { PlusIcon, XIcon } from "lucide-react";

import {
  FILE_UPLOAD_PURPOSE,
  type OnboardingCertificateRow,
} from "@pulse/domain";

import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/ui/FileUploadZone.client";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getCertificateUploadFormatsHint } from "@/lib/files/certificate-upload-hint";
import { useMessages } from "@/components/i18n/LocaleProvider.client";


export type TrainerProfileCertificateRowsProps = {
  rows: OnboardingCertificateRow[];
  disabled: boolean;
  onChange: (rows: OnboardingCertificateRow[]) => void;
};

function emptyCertificate(): OnboardingCertificateRow {
  return { title: "", fileAssetId: undefined };
}

export function TrainerProfileCertificateRows({  rows,
  disabled,
  onChange,
}: TrainerProfileCertificateRowsProps) {
  const messages = useMessages();

  const updateRow = (index: number, patch: Partial<OnboardingCertificateRow>) => {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={row.id ?? index} className="space-y-3 rounded-2xl border border-border p-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`profile-cert-title-${index}`}>
                {messages.trainer.onboarding.certificateTitleLabel}
              </FieldLabel>
              <Input
                id={`profile-cert-title-${index}`}
                value={row.title}
                onChange={(event) => updateRow(index, { title: event.target.value })}
                disabled={disabled}
              />
            </Field>
          </FieldGroup>
          <FileUploadZone
            purpose={FILE_UPLOAD_PURPOSE.CERTIFICATE}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            label={messages.trainer.onboarding.certificateUpload}
            formatsHint={getCertificateUploadFormatsHint(messages)}
            disabled={disabled}
            onUploaded={({ fileAssetId }) => updateRow(index, { fileAssetId })}
          />
          {rows.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
              disabled={disabled}
            >
              <XIcon aria-hidden className="size-4" />
              {messages.trainer.editProfile.removeCertificate}
            </Button>
          ) : null}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...rows, emptyCertificate()])}
        disabled={disabled}
      >
        <PlusIcon aria-hidden className="size-4" />
        {messages.trainer.onboarding.addCertificate}
      </Button>
    </div>
  );
}
