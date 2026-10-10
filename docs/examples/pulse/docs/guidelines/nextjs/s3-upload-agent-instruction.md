# S3 file upload via presigned URLs — Pulse (`file_asset`)

## Document role (read first)

This file is an **implementation guide** for AI agents and developers. It is **subordinate** to product canon:

1. Lifecycle and FK rules — [ADR-007](../../prds/07_governance/adr_007_file_asset_blob_lifecycle.md).
2. Upload contract — [`file_upload_contract.md`](../../implementation/mvp/contracts/file_upload_contract.md).
3. Schema — [`database_schema_v1.md`](../../prds/03_data_model/database_schema_v1.md) — `file_asset`, `file_upload_status`.
4. Authorization — [`policy_enforcement_contract.md`](../../prds/04_authorization_privacy/policy_enforcement_contract.md).
5. Next.js 16 + Vercel — [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) and [ai_nextjs_db_data_handle.md](./ai_nextjs_db_data_handle.md).

**Do not** introduce a parallel file registry: all S3 objects are tracked in Prisma model **`FileAsset`** ([`schema.prisma`](../../../packages/db/prisma/schema.prisma)).

**Cursor rule:** **s3-file-asset-uploads**

---

## Pulse context

- **App:** [`apps/web`](../../../apps/web) — paths below are under `apps/web/src/`.
- **Auth:** Auth.js v5 — `import { auth } from "@/auth"`; resolve session and **enforce policy** before presign or DB writes.
- **Database:** `import { getPrisma } from "@pulse/db"` — never instantiate a second Prisma client for uploads.
- **Domain:** MIME/size/purpose validation and object-key helpers from `@pulse/domain`:
  - `FILE_UPLOAD_PURPOSE`, `validateUploadRequest`, `validateFileAssetReadyForLink`
  - **`FILE_UPLOAD_OBJECT_KEY_PREFIX`** — project-specific root prefix for every S3 key (currently `pulse/`)
  - `buildFileUploadObjectKey(ownerUserId, purpose, fileId)` — canonical key builder
  - `isFileUploadObjectKey(objectKey)` — prefix guard on confirm/read paths
- **Policy:** `@pulse/policy-server` — `assertCanInitiateUpload(ctx, purpose)` on every initiate mutation.
- **Model `FileAsset`:** `blobPathname` (S3 **object key**, server-chosen), optional `blobUrl` (non-expiring public URL when applicable), `mimeType`, `sizeBytes`, `uploadStatus` (`pending` | `ready` | `failed`), `ownerUserId`.
- **Canonical upload lifecycle:** INSERT **`pending`** with server **`blobPathname`** → presigned **PUT** → client uploads to S3 → server **HeadObject** → UPDATE **`ready`** (or **`failed`**). Product FKs only after **`ready`** (**INV-11** / **FM-012**).
- **Reading files:** presigned **GET** only when **`uploadStatus === ready`**; never persist presigned URLs in the DB.

### Object key pattern

All keys **MUST** start with the domain constant prefix:

```
{FILE_UPLOAD_OBJECT_KEY_PREFIX}{ownerUserId}/{purpose}/{uuid}
```

Example:

```
pulse/550e8400-e29b-41d4-a716-446655440000/certificate/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

| Segment | Source |
|---------|--------|
| Prefix | `@pulse/domain` → `FILE_UPLOAD_OBJECT_KEY_PREFIX` (`pulse/`) |
| `ownerUserId` | Session / policy context |
| `purpose` | `FILE_UPLOAD_PURPOSE.*` (`profile_photo`, `certificate`, `verification_doc`) |
| `uuid` | Server-generated (`crypto.randomUUID()`) |

**MUST NOT** accept pathname/objectKey from the client — build with `buildFileUploadObjectKey()` only.

---

## High-level architecture

```
Client selects file
  → Server Action initiateUpload: auth + policy → validate type/size
  → INSERT file_asset (pending) + blobPathname = buildFileUploadObjectKey(...)
  → Server Action beginPresignedUpload (or same action): presigned PUT for blobPathname
  → Client: PUT bytes directly to S3 via XMLHttpRequest (progress UI)
  → Server Action confirmUpload: HeadObject → verify size → UPDATE ready
  → Link FK (certificate, verification doc, profile photo) — ready only
  → updateTag / revalidatePath per ADR-002
```

For **Next.js Server Actions** (`'use server'`, `updateTag`, `revalidatePath`), use MCP **Context7**: library **`/vercel/next.js`**, version **16.2.x**.

---

## Environment variables

Server-only in **`apps/web`** (`.env.local`, Vercel project settings). **No** `NEXT_PUBLIC_*` for secrets.

See [`apps/web/.env.local.example`](../../../apps/web/.env.local.example).

```env
AWS_IAM_USER_ACCESS_KEY=your_access_key_id
AWS_IAM_USER_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
```

Optional: `AWS_S3_ENDPOINT` for LocalStack/MinIO in local dev only.

---

## Dependencies

Install from the **web** package root:

```bash
cd apps/web
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**MUST NOT** add `@vercel/blob` for new upload code — storage is S3 per ADR-001/ADR-007.

---

## Suggested file layout (`apps/web`)

```
src/lib/s3/s3-client.ts                    # S3Client singleton
src/data/file-asset/initiate-upload.server.ts   # INSERT pending + object key (exists)
src/data/file-asset/confirm-upload.server.ts    # HeadObject + UPDATE ready (adapt from Blob)
src/data/file-asset/presign-upload.server.ts    # presigned PUT (new)
src/data/file-asset/presign-read.server.ts      # presigned GET — ready only (new)
src/actions/file-upload/initiate-upload.ts      # thin action wrapper (exists)
src/actions/file-upload/begin-presigned-upload.ts
src/actions/file-upload/confirm-upload.ts
src/components/ui/FileUploadZone.client.tsx     # XHR PUT + progress (exists — adapt transport)
```

Align boundaries with [ai_nextjs_db_data_handle.md](./ai_nextjs_db_data_handle.md): prefer Server Actions when UX should refresh RSC after completion; Route Handlers when an HTTP API or iOS Safari Class A fallback is required.

---

## Implementation notes

### S3 client (`src/lib/s3/s3-client.ts`)

```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.S3_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_IAM_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_IAM_USER_SECRET_ACCESS_KEY!,
  },
});
```

### Object key — domain constant (mandatory)

```typescript
import {
  FILE_UPLOAD_OBJECT_KEY_PREFIX,
  buildFileUploadObjectKey,
  isFileUploadObjectKey,
} from "@pulse/domain";

// initiateUpload (server-only DAL)
const objectKey = buildFileUploadObjectKey(ownerUserId, purpose, randomUUID());
// → "pulse/{ownerUserId}/{purpose}/{uuid}"

// confirmUpload / presigned GET
if (!isFileUploadObjectKey(asset.blobPathname)) {
  throw new Error("Invalid object key");
}
```

Source: [`packages/domain/src/constants/file-upload-purpose.ts`](../../../packages/domain/src/constants/file-upload-purpose.ts), [`file-upload-object-key.ts`](../../../packages/domain/src/constants/file-upload-object-key.ts).

### Initiate upload (pending row)

Pattern matches existing [`initiate-upload.server.ts`](../../../apps/web/src/data/file-asset/initiate-upload.server.ts):

1. `getPolicySessionContext()` + `assertCanInitiateUpload(ctx, purpose)`
2. `validateUploadRequest(purpose, mimeType, sizeBytes)` from `@pulse/domain`
3. `buildFileUploadObjectKey(ownerUserId, purpose, randomUUID())`
4. INSERT `file_asset` with `uploadStatus: "pending"`, `blobPathname: objectKey`
5. Return `{ fileAssetId, pathname: objectKey }` as `MutationResult`

### Presigned PUT

```typescript
"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isFileUploadObjectKey } from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { s3Client } from "@/lib/s3/s3-client";

const UPLOAD_URL_TTL = 300; // 5 minutes — do not increase without security review

export async function createPresignedPutUrl(input: {
  fileAssetId: string;
  mimeType: string;
  sizeBytes: number;
}) {
  // auth + owner check ...
  const asset = await getPrisma().fileAsset.findUnique({ where: { id: input.fileAssetId } });
  if (!asset || asset.uploadStatus !== "pending") throw new Error("Invalid upload state");
  if (!isFileUploadObjectKey(asset.blobPathname)) throw new Error("Invalid object key");

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: asset.blobPathname,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
  });

  return getSignedUrl(s3Client, command, { expiresIn: UPLOAD_URL_TTL });
}
```

MIME/size limits per purpose — [`validate-upload-request.ts`](../../../packages/domain/src/file-upload/validate-upload-request.ts):

| Purpose | Max size | MIME |
|---------|----------|------|
| `profile_photo` | 5 MB | jpeg, png, webp |
| `certificate` | 10 MB | jpeg, png, webp, pdf |
| `verification_doc` | 10 MB | jpeg, png, webp, pdf |

### Confirm upload (HeadObject → ready)

After client PUT:

1. Re-check auth + `ownerUserId` match
2. `isFileUploadObjectKey(blobPathname)`
3. `HeadObjectCommand` — verify object exists and `ContentLength === expectedSize`
4. On mismatch / missing object → UPDATE `failed`
5. On success → UPDATE `ready`; set `sizeBytes`; **`blobUrl` optional** (stable CDN URL post-MVP — do not store expiring presigned URL)

Idempotent: if already `ready`, return success.

### Presigned GET (ready only)

```typescript
const READ_URL_TTL = 7200; // 2 hours

// policy check: owner, admin moderation, public cert vs private verification_doc
const command = new GetObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME!,
  Key: asset.blobPathname,
});
return getSignedUrl(s3Client, command, { expiresIn: READ_URL_TTL });
```

| Purpose | Read policy |
|---------|-------------|
| `profile_photo`, `certificate` | Public catalog — presigned GET or future CDN; never guessable paths without prefix |
| `verification_doc` | **Private** — presigned GET or authenticated proxy Route Handler + `assertCanReadPrivateDoc` |

### Client upload (XHR progress)

1. Call `initiateUpload` → `{ fileAssetId, pathname }`
2. Call presign action → `{ presignedUrl }`
3. **PUT** file bytes to `presignedUrl` via **XMLHttpRequest** (progress events)
4. Call `confirmUpload` with `{ fileAssetId, expectedSize }`
5. Pending UI + toast per **ui-mutation-pending** / **ui-toast-mutations**

Use `FileUploadZone.client.tsx` pattern — `'use client'` per [AGENTS.md](../../../apps/web/AGENTS.md).

---

## Reading files

Generate presigned read URLs **server-side** (Server Component or Server Action). URLs expire in **2 hours** — **do not** store them in `blob_url`.

For `<img src>` with presigned URLs, validate bucket CORS if using custom clients; typical presigned GET works without public bucket ACL.

---

## Cleanup — orphaned objects

Orphan: S3 object or `pending` row where client dropped after PUT but before confirm.

**Recommended (ops):** S3 Lifecycle rule to expire objects under prefix `pulse/` after **24h** (tune per product). Scheduled job (post-MVP) deletes stale `pending` rows using `uploadStatus` + `updatedAt`.

---

## Rules the agent must follow

**Upload**

1. Authenticate and enforce **policy** before presign or any `file_asset` mutation.
2. Validate **MIME** and **size** via `@pulse/domain` — never trust the client.
3. Create **`FileAsset`** with **`pending`** before presigned PUT; use **`buildFileUploadObjectKey()`** — never client-supplied keys.
4. After PUT, use **`HeadObjectCommand`** before marking **`ready`**.
5. Validate prefix with **`isFileUploadObjectKey()`** on confirm and read paths.

**Database**

6. Use **`FileAsset`** only — no duplicate registries.
7. Persist **`blob_pathname`** as canonical S3 object key — not a full public URL.
8. New flows: **`pending` → `ready`/`failed`**; FK links only at **`ready`**.

**Reading files**

9. Presigned GET only when **`uploadStatus === ready`** (unless documented admin exception).
10. Never expose AWS signing credentials to the client; never store presigned URLs in the DB.

**Security**

11. Bucket **private**; Block Public Access on; no public ACLs.
12. Upload presigned URL TTL: **300s**. Read presigned URL TTL: **7200s** unless PRD changes.
13. Domain literals — `FILE_UPLOAD_PURPOSE.*`, `FILE_UPLOAD_MUTATION_ERROR_CODES.*`; user-visible text from `@/lib/messages`.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`file_upload_contract.md`](../../implementation/mvp/contracts/file_upload_contract.md) | Canonical contract |
| [`adr_007_file_asset_blob_lifecycle.md`](../../prds/07_governance/adr_007_file_asset_blob_lifecycle.md) | ADR |
| [`blob-upload-agent-instruction.md`](./blob-upload-agent-instruction.md) | **Deprecated** — Vercel Blob; use this file |
| [`.cursor/rules/s3-file-asset-uploads.mdc`](../../../.cursor/rules/s3-file-asset-uploads.mdc) | Cursor enforcement |

---

**Last updated:** May 2026 · **Pulse** · Next.js 16.2.6 / Vercel · S3 presigned URLs
