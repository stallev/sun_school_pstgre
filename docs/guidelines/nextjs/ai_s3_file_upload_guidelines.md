# AWS S3 File Upload — AI Agent Guidelines

**Тип:** Guideline  
**Стек:** Next.js 16.4 · Vercel · AWS S3 · Prisma `FileAsset`  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Cursor rule:** `s3-file-asset-uploads.mdc`  
**Детальная имплементация:** [`s3-upload-agent-instruction.md`](./s3-upload-agent-instruction.md)  
**Pulse reference:** `docs/examples/pulse/apps/web/src/lib/s3/`, `docs/examples/pulse/packages/domain/src/file-upload/`

> **Канон:** один реестр файлов — Prisma **`FileAsset`**. Прямая загрузка байтов через Server Action **запрещена**; только **presigned PUT** с клиента.

---

## Purpose

Нормы для AI-агентов при реализации загрузки файлов в **AWS S3** на full Pulse stack: presigned URLs, lifecycle `pending → ready | failed`, policy, domain validation.

**Subordinate to (создаются в doc waves):**

1. ADR-007 `adr_007_file_asset_blob_lifecycle.md`
2. Contract `file_upload_contract.md`
3. Schema `database_schema_v1.md` — модель `file_asset`
4. [`policy_enforcement_contract.md`](../../prds/04_authorization_privacy/policy_enforcement_contract.md)

---

## Архитектура (обязательный flow)

```
Client selects file
  → Server Action initiateUpload: auth + policy → validate MIME/size (@{{PACKAGE_SCOPE}}/domain)
  → INSERT file_asset (upload_status: pending, blob_pathname = server-built key)
  → Server Action presignPut: presigned PUT URL (TTL 300s)
  → Client: XMLHttpRequest PUT bytes to S3 (progress UI)
  → Server Action confirmUpload: HeadObject → verify size → UPDATE ready | failed
  → Link product FK only when ready
  → updateTag / revalidatePath (ADR-002)
```

**MUST NOT:** `@vercel/blob`, client-supplied object keys, persist presigned URLs in DB.

---

## AWS S3 — подготовка bucket (bootstrap / ops)

Выполнить **до** первой реализации upload flow (P5+ или фаза с file upload).

### 1. Bucket

| Параметр | Рекомендация |
|----------|--------------|
| Имя | `{{PROJECT_SLUG}}-assets-{env}` (dev/staging/prod — отдельные bucket или prefix) |
| Region | Тот же, что `S3_BUCKET_REGION` (близко к Vercel / Neon) |
| Block Public Access | **ON** — доступ только через presigned URLs или authenticated proxy |
| ACL | Disabled (Bucket owner enforced) |
| Versioning | Optional (prod); не обязательно на MVP |

### 2. IAM user (programmatic access)

Минимальная policy для app credentials (`AWS_IAM_USER_*`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ObjectRW",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/{{S3_KEY_PREFIX}}*"
    },
    {
      "Sid": "ListPrefix",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME",
      "Condition": {
        "StringLike": { "s3:prefix": ["{{S3_KEY_PREFIX}}*"] }
      }
    }
  ]
}
```

Замените `YOUR_BUCKET_NAME` и `{{S3_KEY_PREFIX}}` (domain constant, см. ниже).

### 3. CORS (для browser PUT на presigned URL)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://*.vercel.app",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4. Lifecycle — orphaned uploads

Правило: удалять объекты под prefix `{{S3_KEY_PREFIX}}` старше **24h** без confirm (клиент бросил upload).

### 5. Local dev (optional)

`AWS_S3_ENDPOINT` — LocalStack / MinIO; **только** local `.env.local`, не production.

---

## Environment variables (server-only)

В `apps/web` — **без** `NEXT_PUBLIC_*` для секретов.

```env
AWS_IAM_USER_ACCESS_KEY=
AWS_IAM_USER_SECRET_ACCESS_KEY=
S3_BUCKET_REGION=
S3_BUCKET_NAME=
# Optional local:
# AWS_S3_ENDPOINT=http://localhost:4566
```

Добавить в Vercel Project Settings (Production / Preview / Development).  
Образец: `docs/examples/pulse/apps/web/.env.local.example`

---

## Domain constants (заполнить в `@{{PACKAGE_SCOPE}}/domain`)

| Constant | Placeholder | Назначение |
|----------|-------------|------------|
| `FILE_UPLOAD_OBJECT_KEY_PREFIX` | `{{S3_KEY_PREFIX}}` | e.g. `acme/` — **каждый** ключ начинается с этого prefix |
| `FILE_UPLOAD_PURPOSE` | per product | `profile_photo`, `certificate`, … |
| `buildFileUploadObjectKey()` | — | `{prefix}{ownerUserId}/{purpose}/{uuid}` |
| `isFileUploadObjectKey()` | — | Guard на confirm/read |

**MUST NOT** принимать `objectKey` / `pathname` от клиента.

Пример ключа:

```
{{S3_KEY_PREFIX}}{ownerUserId}/{purpose}/{uuid}
```

---

## Prisma `FileAsset` (schema-ready)

| Поле | Роль |
|------|------|
| `blob_pathname` | Canonical S3 object key (не public URL) |
| `upload_status` | `pending` \| `ready` \| `failed` |
| `mime_type`, `size_bytes` | После validate / HeadObject |
| `owner_user_id` | FK → User |
| `blob_url` | Optional stable CDN URL (post-MVP); **не** expiring presigned |

Product FK (certificate, avatar, …) — **только** после `upload_status = ready`.

---

## Dependencies (`apps/web`)

```bash
cd apps/web
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## File layout (целевой)

```
apps/web/src/
├── lib/s3/s3-client.ts
├── data/file-asset/
│   ├── initiate-upload.server.ts
│   ├── presign-upload.server.ts
│   ├── confirm-upload.server.ts
│   └── presign-read.server.ts
├── actions/file-upload/
│   ├── initiate-upload.ts
│   ├── begin-presigned-upload.ts
│   └── confirm-upload.ts
└── components/ui/FileUploadZone.client.tsx
```

DAL pattern: [`ai_nextjs_db_data_handle.md`](./ai_nextjs_db_data_handle.md)

---

## TTL и security

| Operation | TTL | Rule |
|-----------|-----|------|
| Presigned PUT | **300s** | Не увеличивать без security review |
| Presigned GET | **7200s** | Генерировать on-demand; не хранить в DB |
| Private docs | policy | `verification_doc` — только owner/admin + presigned GET |

Checklist:

- [ ] Auth + `@{{PACKAGE_SCOPE}}/policy-server` на каждой upload mutation
- [ ] MIME/size — `validateUploadRequest()` из domain
- [ ] HeadObject перед `ready`
- [ ] Domain literals — `FILE_UPLOAD_*` constants; UI text — `@/lib/messages`
- [ ] Pending UI + toast — **ui-mutation-pending**, **ui-toast-mutations**

---

## Agent implementation order

1. Domain: prefix, purposes, validators, `buildFileUploadObjectKey`
2. Schema: `file_asset` + enums (W3)
3. Contract: `file_upload_contract.md` (W8)
4. `s3-client.ts` + env validation
5. DAL: initiate → presign → confirm → presign-read
6. Thin Server Actions + `FileUploadZone.client.tsx` (XHR progress)
7. Policy assertions per purpose
8. Smoke: upload → confirm → presigned GET

**Context7:** `@aws-sdk/client-s3` API при сомнениях.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`s3-upload-agent-instruction.md`](./s3-upload-agent-instruction.md) | Пошаговый код и примеры |
| [`blob-upload-agent-instruction.md`](./blob-upload-agent-instruction.md) | **Deprecated** — Vercel Blob |
| [`stack_patterns_from_pulse.md`](../../reference/stack_patterns_from_pulse.md) | Monorepo patterns |
| Pulse snapshot | `docs/examples/pulse/` — working implementation |

---

**Last updated:** template · **{{PROJECT_NAME}}** · S3 presigned + FileAsset
