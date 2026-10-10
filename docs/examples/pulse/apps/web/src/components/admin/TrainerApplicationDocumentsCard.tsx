import { SectionTitle } from "@/components/atoms";
import { TrainerApplicationDocumentRow } from "@/components/admin/TrainerApplicationDocumentRow";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import type { TrainerApplicationDocument } from "@/data/admin/get-trainer-application.server";
import { getMessages } from "@/lib/messages/server";


export type TrainerApplicationDocumentsCardProps = {
  certificates: TrainerApplicationDocument[];
  verificationDocuments: TrainerApplicationDocument[];
};

function formatVerificationTitle(docType: string): string {
  return docType.charAt(0).toUpperCase() + docType.slice(1);
}

export async function TrainerApplicationDocumentsCard({  certificates,
  verificationDocuments,
}: TrainerApplicationDocumentsCardProps) {
  const messages = await getMessages();

  const hasCertificates = certificates.length > 0;
  const hasVerification = verificationDocuments.length > 0;

  if (!hasCertificates && !hasVerification) {
    return null;
  }

  return (
    <section className="space-y-3">
      <SectionTitle>{messages.admin.moderation.documentsTitle}</SectionTitle>

      <PulseCard variant="compact" className="rounded-2xl ring-1 ring-border">
        <PulseCardContent density="sm" className="space-y-4">
          {hasCertificates ? (
            <div className="space-y-2">
              <SectionTitle as="h3" className="mx-0 max-w-none text-left text-sm">
                {messages.admin.moderation.certificatesSection}
              </SectionTitle>
              <ul className="space-y-2">
                {certificates.map((document) => (
                  <TrainerApplicationDocumentRow
                    key={document.id}
                    id={document.id}
                    title={document.title}
                    fileAssetId={document.fileAssetId}
                    uploadStatus={document.uploadStatus}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {hasVerification ? (
            <div className="space-y-2">
              <SectionTitle as="h3" className="mx-0 max-w-none text-left text-sm">
                {messages.admin.moderation.verificationSection}
              </SectionTitle>
              <ul className="space-y-2">
                {verificationDocuments.map((document) => (
                  <TrainerApplicationDocumentRow
                    key={document.id}
                    id={document.id}
                    title={formatVerificationTitle(document.title)}
                    fileAssetId={document.fileAssetId}
                    uploadStatus={document.uploadStatus}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </PulseCardContent>
      </PulseCard>
    </section>
  );
}
