# apps/workers

Entrypoints для фоновых задач (Vercel Cron, batch jobs).

**Статус:** каталог зарезервирован. На MVP jobs могут жить в `apps/web/app/api/jobs/` до выделения пакета.

**Паттерн:** idempotency + delivery_log — см. lampto [`docs/examples/lampto/docs/meta/ai_first_project_methodology.md`](../docs/examples/lampto/docs/meta/ai_first_project_methodology.md) §1.1
