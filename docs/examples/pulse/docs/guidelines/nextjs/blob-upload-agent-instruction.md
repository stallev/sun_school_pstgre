# Vercel Blob file upload — DEPRECATED

> **Status:** Superseded by S3 storage per [ADR-001](../../prds/07_governance/adr_001_stack_and_runtime.md) (v1.1) and [ADR-007](../../prds/07_governance/adr_007_file_asset_blob_lifecycle.md) (v1.1).
>
> **Use instead:** [`s3-upload-agent-instruction.md`](./s3-upload-agent-instruction.md)

This file is retained only for historical diff context. Do not implement new upload features against Vercel Blob or `@vercel/blob`.

**Migration note:** Existing `apps/web` Route Handler `/api/upload` (`handleUpload`) will be replaced by S3 presigned PUT flow documented in the S3 guide. Lifecycle (`pending` → `ready` → `failed`), policy, and `FileAsset` registry rules are unchanged.
