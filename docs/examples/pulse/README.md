# Pulse snapshot (read-only)

This directory is a **vendored implementation snapshot** of Pulse (fitness trainer marketplace): code, PRD, guidelines, and Cursor Rules **as they existed in Pulse**.

It is **not** the source of truth for a new product built from this boilerplate.

## Layout

| Path | What |
|------|------|
| `AGENTS.md`, `apps/web/` | Pulse monorepo + Next.js app |
| `.cursor/rules/` | Pulse namesake rules — **not** boilerplate canon |
| `docs/` | Pulse PRD, guidelines, contracts, Design Lab spec |
| `packages/` | Pulse `@pulse/*` packages |

## What is not here

- **`docs/examples/lampto/` is not vendored.** Historical “follow lampto” language in deep files is provenance. The stub [`docs/reference/lampto_project_reference.md`](docs/reference/lampto_project_reference.md) explains that the tree is missing.

## For a new product

Use the **repository root**:

- [`.cursor/rules/`](../../../.cursor/rules/) and [`guidelines/`](../../../guidelines/)
- [`docs/reference/pulse_project_reference.md`](../../reference/pulse_project_reference.md)

When this snapshot is silent on architecture, copy **patterns from this tree** — do not invent a missing `lampto` tree.
