# Data fetching patterns — Next.js 16 / React 19

**Stack:** Next.js **16.4**, React 19, Prisma v7  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Deep dive:** [`docs/general/02-data-fetching.md`](../../general/02-data-fetching.md)  
**DAL canon:** [`ai_nextjs_db_data_handle.md`](./ai_nextjs_db_data_handle.md)  
**Loading UX:** [`ai_loading_patterns.md`](./ai_loading_patterns.md)  
**Cursor rules:** **data-server-actions-and-api**, **app-router-streaming-loading**

---

## 1. Architectural default (MUST)

**Server Components → DAL directly.** Не делать self-fetch к собственным API из RSC.

```typescript
// ❌ Anti-pattern
const user = await fetch("/api/user").then((r) => r.json());

// ✅ DAL
const user = await getUserFromDb(userId);
```

Client-side `fetch` / TanStack Query — только для сложной **client-only** логики (optimistic toggles, infinite scroll, tab sync).

---

## 2. Cache layers (Next.js 16)

```
React.cache()     → per-request dedup (one render pass)
'use cache'       → cross-request (Vercel Data Cache)
Full Route Cache  → HTML + RSC payload
Router Cache      → client navigation
```

### React.cache() — per-request dedup

```typescript
import { cache } from "react";

export const getUser = cache(async (userId: string) => {
  return db.users.findUnique({ where: { id: userId } });
});
// Header + Sidebar both call getUser('123') → one DB query
```

### 'use cache' — cross-request

```typescript
import { cacheLife, cacheTag } from "next/cache";

export async function getPublicTrainers() {
  "use cache";
  cacheLife("hours");
  cacheTag("trainers");
  return db.trainers.findMany({ where: { status: "approved" } });
}
```

### Invalidation (Server Actions)

| Method | When |
|--------|------|
| `updateTag(tag)` | Server Action — read-your-own-writes |
| `revalidateTag(tag)` | Webhook / background |
| `revalidatePath(path)` | Full route invalidate |

---

## 3. Parallel vs streaming

```tsx
// ✅ Parallel independent queries
const [user, stats] = await Promise.all([
  getUserFromDb(userId),
  getStatsFromDb(userId),
]);

// ✅ Streaming — fast shell first
<Suspense fallback={<StatsSkeleton />}>
  <SlowStats />
</Suspense>
```

Prefer **separate Suspense boundaries** per slow region — см. **app-router-streaming-loading**.

### 3.1 Promise combinators — `all` vs `allSettled` vs `any` vs `race`

- **`Promise.all` fails fast on the first rejection** — the other promises keep running to completion with their results discarded ("ghost requests": wasted work/resources). For independent sources where a non-critical one may fail (e.g. dashboard: user + recommendations + ads), use **`Promise.allSettled`** and treat critical results as throw-worthy, non-critical ones as default-on-`rejected`.
- **`Promise.any`** resolves on the first **success** (ignores rejections until all reject, then throws `AggregateError`) — use for racing fallback sources (multiple CDN mirrors), not a sequential `for (url of sources) { try { await fetch(url) } catch { continue } }` loop.
- **`Promise.race`** settles on the first **completion**, success or failure — distinct from `any`. **Never call it with an empty array** — `Promise.race([])` never resolves (silent hang/leak). `Promise.all([])`/`Promise.allSettled([])` resolve immediately with `[]`; `Promise.any([])` rejects immediately with `AggregateError`.

### 3.2 Async/await error handling

- **Every promise chain ends in a `.catch()`** (or is wrapped in `try/catch` under `await`) that logs and returns a fallback — an unhandled rejection crashes the Node process (Node 15+) or fails silently in the browser. "Swallow vs propagate" must be a conscious choice, not an omission.
- **Prefer an explicit Result shape over nested try/catch** for multi-step await chains where different failures mean different things (e.g. payment step vs non-critical email-send step) — a `{ data, error }` / discriminated-union return makes it explicit in the function signature which failures are expected/recoverable vs which should propagate, instead of relying on catch-block nesting depth to convey severity. In Server Actions, this is the same discipline as `MutationResult<T>` — see [`ai_typescript_monorepo_guidelines.md`](../typescript/ai_typescript_monorepo_guidelines.md) §4.

---

## 4. Client fetch — race conditions

When client `fetch` is required:

### AbortController (MUST for search/filter effects)

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/products?category=${categoryId}`, { signal: controller.signal })
    .then(/* ... */)
    .catch((err) => {
      if (err.name !== "AbortError") setError(err.message);
    });
  return () => controller.abort();
}, [categoryId]);
```

### Stable Promise for `use()` (React 19)

Не создавать новый Promise каждый render — кэшировать вне компонента или передавать с сервера как prop. Consumer обязательно оборачивать в `<Suspense>` + `ErrorBoundary` — rejected Promise без него крашит дерево. Hooks-канон: [`ai_react_hooks_guidelines.md`](../react/ai_react_hooks_guidelines.md) §7.

---

## 5. Retry (client / edge cases)

- **Exponential backoff + jitter** — не синхронные retry-шторма (Thundering Herd)
- **Не retry** 400, 401, 403, 404, 422
- **Retry** 429 (respect `Retry-After`), 5xx, network errors
- iOS Safari `Load failed` — см. **ios-safari-mutation-transport**

---

## 6. Libraries vs custom

| Use Server + DAL | Use TanStack Query / SWR |
|------------------|--------------------------|
| Page data, lists, detail | Complex client cache, infinite scroll |
| `'use cache'` public reads | Multi-tab sync |
| Server Actions mutations | Polling |

**Senior rule:** понимай, что делает библиотека под капотом, прежде чем добавлять dependency.

---

## 7. Parent–child data: no refetch waterfall

When a parent server component already loaded a list or entity from DAL, **pass plain serializable props** to children. Do not refetch the same row by id in each child.

```tsx
// ✅ Parent fetched list; children receive DTOs
async function TrainerCatalogGrid({ query }: { query: CatalogQuery }) {
  const trainers = await getCatalogTrainers(query)
  return trainers.map((trainer) => (
    <TrainerCard key={trainer.id} trainer={trainer} />
  ))
}

function TrainerCard({ trainer }: { trainer: CatalogTrainerDto }) {
  return (/* presentational — no await */)
}
```

```tsx
// ❌ Parent had the row; child refetches by id
async function TrainerCard({ trainerId }: { trainerId: string }) {
  const trainer = await getTrainerById(trainerId) // duplicate query
  return (/* … */)
}
```

**Exceptions**

- Child needs **different** data shape or authorization scope — separate DAL function, still prefer passing id only when parent did not already load entity.
- Client leaf with `use(promise)` — server passes unresolved `Promise` only when documented (search-as-you-type, hover popover).

Provenance: evaluated against [nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill) — **not installed**; [`adr_010_nextjs_app_architecture_skill.md`](../../reference/adr_010_nextjs_app_architecture_skill.md).

---

## 8. Agent checklist

- [ ] RSC не self-fetch к `/api/*`
- [ ] Shared server reads обёрнуты в `cache()` или `'use cache'`
- [ ] Server Action mutations → `updateTag` / `revalidatePath` где нужно
- [ ] Client effects с changing deps → `AbortController`
- [ ] Parallel `Promise.all` vs sequential await — осознанный выбор
- [ ] Non-critical parallel source → `Promise.allSettled`, not `Promise.all` (§3.1)
- [ ] Every promise chain has a terminal `.catch()` / `try-catch` (§3.2)
- [ ] Mutation vs route loading разделены (**ai_loading_patterns** §13)
- [ ] Parent не refetch'ит то, что уже передал дочернему компоненту (§7)

---

## 9. Related

| Document | Topic |
|----------|--------|
| [`docs/general/02-data-fetching.md`](../../general/02-data-fetching.md) | Full theory: SWR, dedup impl, retry code |
| [`ai_nextjs_db_data_handle.md`](./ai_nextjs_db_data_handle.md) | Actions vs Route Handlers |
| [`ai_optimistic_ui_pattern.md`](../react/ai_optimistic_ui_pattern.md) | Client optimistic |
| Pulse reference | `docs/examples/pulse/apps/web/src/data/` |
| [`adr_010_nextjs_app_architecture_skill.md`](../../reference/adr_010_nextjs_app_architecture_skill.md) | External RSC skill mapping |

**Reference:** Pulse (docs/examples/pulse) — DAL structure; **Guidelines текущего проекта override Pulse**.
