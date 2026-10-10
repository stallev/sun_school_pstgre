# Incidents — Pulse

Зафиксированные production-классы проблем и **канонические mitigation patterns** для агентов и команды.

**Methodology:** перенос из lampto incidents с адаптацией под Vercel, `@pulse/domain`, [`canonical_routes.md`](../design/canonical_routes.md).

| Document | Topic | Cursor rule |
|----------|-------|-------------|
| [`nextjs-server-actions-safari-load-failed.md`](./nextjs-server-actions-safari-load-failed.md) | iOS Safari `TypeError: Load failed` on Server Actions | **ios-safari-mutation-transport** |
| [`ios-safari-mutation-transport-pattern.md`](./ios-safari-mutation-transport-pattern.md) | Class A/B dual transport, DAL, utilities | **ios-safari-mutation-transport** |

**Guidelines:** [`ai_nextjs_db_data_handle.md`](../guidelines/nextjs/ai_nextjs_db_data_handle.md) §7 · [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md) §7

**Lampto source (read-only):** [`docs/examples/lampto/docs/incidents/`](../examples/lampto/docs/incidents/)
