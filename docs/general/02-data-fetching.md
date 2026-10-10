# Загрузка данных и сетевые запросы

> Стек: Next.js 16 (App Router), React 19, TypeScript

---

## Оглавление

1. [Фундамент: как работают асинхронные запросы в браузере](#фундамент)
2. [Race Conditions](#race-conditions)
3. [Дедупликация запросов](#дедупликация)
4. [Retry с Exponential Backoff и Jitter](#retry)
5. [Stale-While-Revalidate](#stale-while-revalidate)
6. [React 19: use() и новые паттерны](#react-19)
7. [Next.js 16 App Router: кэш, DAL и серверные данные](#nextjs-app-router)
8. [Когда использовать библиотеки vs самописное решение](#библиотеки-vs-самописное)

---

## Фундамент

Прежде чем разбирать паттерны, нужно понять, как JS работает с асинхронностью.

### Event Loop и почему важно не блокировать поток

JavaScript — однопоточный язык. Когда ты делаешь `fetch()`, браузер:
1. Регистрирует запрос в Web API (не в JS-потоке)
2. Возвращает управление в JS (Event Loop продолжает работать)
3. Когда ответ готов — callback/Promise попадает в Microtask Queue
4. После текущей задачи Event Loop берёт callback из очереди

```
Call Stack → Web APIs → Callback/Microtask Queue → Call Stack
    |              |              |
  fetch()      HTTP req      resolve(data)
```

**Практический вывод:** `fetch` не блокирует UI. Но `await` внутри синхронного кода фактически «приостанавливает» выполнение функции — не весь поток.

### Промисы и состояния

Каждый `Promise` находится в одном из трёх состояний:
- `pending` — ожидает
- `fulfilled` — выполнен с значением
- `rejected` — отклонён с ошибкой

Переход необратим. Это важно для понимания race conditions.

---

## Race Conditions

### Что это и почему возникает

Race condition в контексте HTTP-запросов — ситуация, когда более поздний запрос завершается раньше более раннего, и устаревшие данные перезаписывают актуальные.

```
Пользователь: выбирает "Категория A" → запрос #1 начинается
Пользователь: выбирает "Категория B" → запрос #2 начинается

Запрос #2 завершается (данные для B) → UI показывает B ✅
Запрос #1 завершается (данные для A) → UI показывает A ❌ (старые данные!)
```

### Наивная реализация (с багом)

```tsx
// ❌ Классическая ошибка — race condition
function ProductList({ categoryId }: { categoryId: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`/api/products?category=${categoryId}`)
      .then(res => res.json())
      .then(data => setProducts(data)); // Нет отмены предыдущего запроса!
  }, [categoryId]);

  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

### Решение 1: AbortController

`AbortController` — встроенный браузерный API для отмены запросов.

```tsx
// ✅ С AbortController
function ProductList({ categoryId }: { categoryId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/products?category=${categoryId}`, {
          signal: controller.signal, // Привязываем сигнал к запросу
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setProducts(data);
      } catch (err) {
        // AbortError — нормальное завершение, не ошибка
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProducts();

    // Cleanup: отменяем запрос при следующем рендере или размонтировании
    return () => controller.abort();
  }, [categoryId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

### Решение 2: Флаг актуальности (для случаев без AbortController)

Иногда запрос нельзя отменить (например, сторонняя библиотека). Тогда используй флаг:

```tsx
useEffect(() => {
  let isCurrent = true; // Флаг актуальности этого конкретного эффекта

  fetchProducts(categoryId).then(data => {
    if (isCurrent) { // Обновляем state только если запрос ещё актуален
      setProducts(data);
    }
  });

  return () => {
    isCurrent = false; // Эффект устарел
  };
}, [categoryId]);
```

### Решение 3: React 19 — use() с Suspense (правильный путь)

```tsx
// ✅ React 19 подход — данные как Promise
import { use, Suspense } from 'react';

function ProductList({ categoryId }: { categoryId: string }) {
  // React сам управляет жизненным циклом запроса
  const products = use(fetchProducts(categoryId));
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

function ProductsPage({ categoryId }: { categoryId: string }) {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductList categoryId={categoryId} />
    </Suspense>
  );
}
```

> **Важно:** `use()` в клиентских компонентах требует стабильного Promise-объекта. Если каждый рендер создаёт новый промис — компонент будет перезапускаться в цикле. Кэшируй промис за пределами рендера или используй `React.cache()` для Server Components.

---

## Дедупликация

### Проблема

У тебя 10 компонентов на странице, каждый хочет данные текущего пользователя. Без дедупликации — 10 одинаковых запросов.

```
Component1: fetch('/api/user') → запрос #1
Component2: fetch('/api/user') → запрос #2
...
Component10: fetch('/api/user') → запрос #10
```

### Решение: Кэш промисов

**Ключевая идея:** Не кэшируй данные — кэшируй сам промис. Все подписчики получат один и тот же результат.

```typescript
// lib/request-deduplication.ts

type PromiseCache = Map<string, Promise<unknown>>;
const cache: PromiseCache = new Map();

export function dedupe<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 0 // время жизни в мс, 0 = удалить после resolve
): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key) as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    if (ttl === 0) {
      cache.delete(key);
    } else {
      setTimeout(() => cache.delete(key), ttl);
    }
  });

  cache.set(key, promise);
  return promise;
}

export function getUser(userId: string) {
  return dedupe(
    `user:${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json()),
    5000 // кэш на 5 секунд
  );
}
```

### Дедупликация в Next.js App Router

Next.js предоставляет два механизма дедупликации.

**`React.cache()` — для Server Components в рамках одного запроса:**

```typescript
// data/get-user.server.ts
import { cache } from 'react';

// cache() мемоизирует результат на время одного рендера (per-request)
export const getUser = cache(async (userId: string) => {
  return db.users.findUnique({ where: { id: userId } });
});

// Оба Server Component вызовут getUser('123') —
// но реальный запрос к БД произойдёт ОДИН раз
async function Header() {
  const user = await getUser('123');
  return <nav>{user.name}</nav>;
}

async function Sidebar() {
  const user = await getUser('123'); // Дедуплицируется через cache()!
  return <aside>{user.avatar}</aside>;
}
```

**`'use cache'` — для межзапросного кэша (Next.js 16):**

```typescript
// data/get-catalog.server.ts
import { cacheLife, cacheTag } from 'next/cache';

// Кэшируется между запросами — на уровне фреймворка
export async function getCatalogItems() {
  'use cache';
  cacheLife('hours'); // свежий 1 час
  cacheTag('catalog');
  return db.items.findMany();
}
```

> **Архитектурное отличие:**
> - `React.cache()` — per-request мемоизация; данные не переживают один HTTP-запрос
> - `'use cache'` — persistent кэш на уровне Vercel Data Cache; данные живут между запросами

---

## Retry

### Почему нельзя просто `retry N раз`

Представь: твой сервер перегружен. 100 клиентов получают ошибку и сразу делают повторный запрос. Сервер получает 100 одновременных retry — ситуация усугубляется. Это называется **Thundering Herd Problem**.

### Exponential Backoff

Ждём всё дольше с каждой попыткой:
- Попытка 1: ждём 1 сек
- Попытка 2: ждём 2 сек
- Попытка 3: ждём 4 сек
- Попытка N: ждём `2^(N-1)` сек

### Jitter

Добавляем случайность к задержке, чтобы клиенты не синхронизировались:

```typescript
// lib/retry.ts

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;      // мс
  maxDelay?: number;       // мс
  jitter?: boolean;
  retryOn?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30_000,
    jitter = true,
    retryOn = (err: Error) => isRetryableError(err),
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxAttempts || !retryOn(lastError, attempt)) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      let delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

      // Jitter: случайное смещение ±50% от задержки
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      onRetry?.(lastError, attempt, delay);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryableError(err: Error): boolean {
  // Не retry-able: 400, 401, 403, 404, 422
  if (/\b4[0-9]{2}\b/.test(err.message) && !err.message.includes('429')) {
    return false;
  }
  // Retry-able: 429, 500, 502, 503, 504, сетевые ошибки
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Использование
const data = await withRetry(
  () => fetch('/api/data').then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (err, attempt, delay) => {
      console.warn(`Попытка ${attempt} не удалась: ${err.message}. Retry через ${delay}ms`);
    },
  }
);
```

### HTTP 429 и Retry-After

```typescript
export async function fetchWithRespectForRateLimit(url: string): Promise<Response> {
  const response = await fetch(url);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter
      ? parseInt(retryAfter) * 1000  // Сервер сказал, сколько ждать
      : 60_000;                       // Дефолт: 1 минута

    await sleep(delay);
    return fetchWithRespectForRateLimit(url); // Рекурсивный retry
  }

  return response;
}
```

---

## Stale-While-Revalidate

### Концепция

SWR — паттерн кэширования с тремя состояниями данных:
- **Fresh** (свежие): используем напрямую, запрос не нужен
- **Stale** (устаревшие): показываем немедленно, в фоне делаем запрос
- **Gone** (истекли): данных нет, показываем загрузку

**Пользовательский опыт:** Мгновенное отображение данных + фоновое обновление = кажется, что приложение очень быстрое.

### Реализация с нуля

```typescript
// lib/swr-cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise: Promise<T> | null;
}

interface SWROptions<T> {
  ttl?: number;         // Fresh время в мс
  staleTtl?: number;    // Stale время в мс (после этого — Gone)
  onUpdate?: (data: T) => void;
}

class SWRCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: SWROptions<T> = {}
  ): Promise<T> {
    const { ttl = 5_000, staleTtl = 60_000, onUpdate } = options;
    const now = Date.now();
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // GONE: нет данных или истекли
    if (!entry || now - entry.timestamp > staleTtl) {
      const promise = fetcher();
      this.cache.set(key, { data: entry?.data as T, timestamp: entry?.timestamp ?? 0, promise });
      const data = await promise;
      this.cache.set(key, { data, timestamp: now, promise: null });
      return data;
    }

    // STALE: данные устарели, но ещё допустимы
    if (now - entry.timestamp > ttl) {
      if (!entry.promise) {
        const promise = fetcher().then(freshData => {
          this.cache.set(key, { data: freshData, timestamp: Date.now(), promise: null });
          onUpdate?.(freshData);
          return freshData;
        });
        this.cache.set(key, { ...entry, promise });
      }
      return entry.data; // Возвращаем stale данные немедленно
    }

    // FRESH: данные актуальны
    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const swrCache = new SWRCache();
```

### Хук useSWR для Client Components

```tsx
// hooks/use-swr.ts
import { useState, useEffect, useCallback } from 'react';

interface SWRState<T> {
  data: T | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  mutate: (data?: T | ((prev: T | undefined) => T)) => void;
}

export function useSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { dedupingInterval?: number; revalidateOnFocus?: boolean } = {}
): SWRState<T> {
  const { dedupingInterval = 2000, revalidateOnFocus = true } = options;

  const [state, setState] = useState<Omit<SWRState<T>, 'mutate'>>({
    data: undefined,
    isLoading: true,
    isValidating: false,
    error: null,
  });

  const revalidate = useCallback(async () => {
    setState(prev => ({ ...prev, isValidating: true }));
    try {
      const data = await fetcher();
      setState({ data, isLoading: false, isValidating: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false,
        isValidating: false,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { revalidate(); }, [revalidate]);

  useEffect(() => {
    if (!revalidateOnFocus) return;
    const handleFocus = () => revalidate();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidate, revalidateOnFocus]);

  return { ...state, mutate: () => {} };
}
```

---

## React 19

### Новый хук use()

`use()` — новый API, позволяющий «разворачивать» Promise прямо внутри рендер-функции. Компонент приостанавливается, пока Promise не разрешится, и рендерится ближайший `<Suspense>`.

```tsx
import { use, Suspense, cache } from 'react';

// cache() — мемоизация для Server Components (работает на один запрос)
const getUser = cache(async (id: string) => {
  return fetch(`/api/users/${id}`).then(r => r.json());
});

// ✅ React 19: async Server Component
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <div>{user.name}</div>;
}

// ✅ React 19: use() в Client Component (Promise передан как проп)
function UserName({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Triggering Suspense
  return <span>{user.name}</span>;
}

function Page({ userId }: { userId: string }) {
  const userPromise = getUser(userId); // Создаём Promise на сервере

  return (
    <Suspense fallback={<Skeleton />}>
      <UserName userPromise={userPromise} /> {/* Передаём Promise как проп */}
    </Suspense>
  );
}
```

### useOptimistic — оптимистичные обновления

React 19 вводит `useOptimistic` для немедленного обновления UI до подтверждения сервера:

```tsx
import { useOptimistic, useTransition } from 'react';

function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(initialLikes);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      setOptimisticLikes(prev => prev + 1); // Немедленное обновление UI
      try {
        await likePost(postId); // Реальный запрос
      } catch {
        // React автоматически откатывает optimistic значение при ошибке
      }
    });
  }

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      aria-busy={isPending}
    >
      ❤️ {optimisticLikes}
    </button>
  );
}
```

### useTransition для неблокирующих обновлений

```tsx
import { useTransition } from 'react';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value); // Немедленное обновление инпута

    startTransition(async () => {
      // В React 19 startTransition принимает async-функцию напрямую
      await setSearchResults(value); // Менее приоритетное обновление
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
    </>
  );
}
```

---

## Next.js 16 App Router

### Кэш-слои

```
Request Memoization — React.cache() — один рендер-пасс
    ↓
Data Cache — 'use cache' directive — между запросами (Vercel)
    ↓
Full Route Cache — HTML + RSC payload — автоматически
    ↓
Router Cache — клиентская навигация
```

### Архитектурный сдвиг: DAL вместо self-fetch

В Next.js App Router **не нужно** делать HTTP-запросы к собственным эндпоинтам из Server Components. Server Component может напрямую вызывать функции из data access layer (DAL), Prisma, или любой серверный код:

```typescript
// ❌ Антипаттерн — self-fetch из RSC
async function DashboardPage() {
  const user = await fetch('/api/user').then(r => r.json()); // Лишний HTTP-хоп!
  return <Dashboard user={user} />;
}

// ✅ Прямой вызов DAL
async function DashboardPage() {
  const user = await getUserFromDb(userId); // Напрямую, без HTTP
  return <Dashboard user={user} />;
}
```

**Преимущества:** нет сетевого хопа, нет сериализации/десериализации, нет авторизации в API-эндпоинте (уже сделана в DAL).

### 'use cache' — новый стандарт кэширования (Next.js 16)

Next.js 16 вводит директиву `'use cache'` вместо устаревших опций `fetch({ next: { revalidate: N } })`:

```typescript
import { cacheLife, cacheTag } from 'next/cache';

// Кэшировать функцию целиком
export async function getPublicTrainers() {
  'use cache';
  cacheLife('hours');        // свежий 1 час, stale 1 день
  cacheTag('trainers');      // тег для инвалидации

  return db.trainers.findMany({ where: { status: 'approved' } });
}

// Кэшировать отдельный компонент
async function TrainerCard({ trainerId }: { trainerId: string }) {
  'use cache';
  cacheLife('minutes');
  cacheTag(`trainer-${trainerId}`);

  const trainer = await db.trainers.findUnique({ where: { id: trainerId } });
  return <Card>{trainer.name}</Card>;
}
```

**Встроенные профили `cacheLife`:**

| Профиль | Freshness | Stale TTL | Max TTL |
|---------|-----------|-----------|---------|
| `'seconds'` | 0s | 60s | 60s |
| `'minutes'` | 60s | 5 min | 10 min |
| `'hours'` | 3600s | 1 day | 7 days |
| `'days'` | 86400s | 7 days | 30 days |
| `'weeks'` | 7 days | 30 days | 30 days |
| `'max'` | 30 days | 30 days | 30 days |

### updateTag — read-your-own-writes (Next.js 16)

В Server Actions используй `updateTag` — он инвалидирует кэш **и** немедленно обновляет его в текущем запросе. Это обеспечивает read-your-own-writes: пользователь видит свои изменения мгновенно.

```typescript
'use server';
import { updateTag } from 'next/cache';

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile);

  // Инвалидирует кэш + немедленно обновляет — пользователь видит изменения
  updateTag(`user-${userId}`);
}
```

**Сравнение методов инвалидации:**

| Метод | Когда использовать |
|-------|--------------------|
| `updateTag(tag)` | Server Action; read-your-own-writes |
| `revalidateTag(tag)` | Фоновое обновление; webhook-хандлер |
| `revalidatePath(path)` | Инвалидировать полный маршрут |

### Паттерны загрузки данных

```tsx
// app/dashboard/page.tsx

// ✅ Параллельная загрузка (не последовательная!)
async function DashboardPage() {
  // Запускаем оба запроса параллельно — не ждём первого перед вторым
  const [user, stats] = await Promise.all([
    getUserFromDb(userId),
    getStatsFromDb(userId),
  ]);

  return <Dashboard user={user} stats={stats} />;
}

// ✅ Streaming с Suspense — быстрые данные сразу, медленные стримятся
async function DashboardPage() {
  return (
    <div>
      <Header /> {/* Статика — рендерится сразу */}

      <Suspense fallback={<Statskeleton />}>
        <SlowStats /> {/* Медленные данные — стримятся отдельно */}
      </Suspense>
    </div>
  );
}
```

---

## Библиотеки vs Самописное

| Критерий | Самописное | TanStack Query / SWR |
|---------|-----------|---------------------|
| Контроль | Полный | Ограниченный API |
| Время разработки | Высокое | Минимальное |
| Battle-tested | Нет | Да (миллионы проектов) |
| Bundle size | 0 | ~13KB (TanStack Query) |
| DevTools | Нет | Встроенные |
| Когда выбирать | Специфические требования, Server Components | Клиентские компоненты, сложная клиентская логика |

**Senior-решение:** В Next.js App Router **максимально используй Server Components с DAL и `'use cache'`**. TanStack Query / SWR — только для сложной клиентской логики (оптимистичные обновления, инфинит-скролл, синхронизация вкладок), которую нельзя вынести на сервер.

> **Принцип:** Понимай механизм работы библиотеки, чтобы правильно её использовать и уметь заменить при необходимости. Senior не «использует библиотеку» — он знает, что она делает под капотом.
