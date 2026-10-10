# Код-сплиттинг и оптимизация бандла

> Стек: Next.js 16 (App Router), React 19, TypeScript, Turbopack

---

## Оглавление

1. [Фундамент: что такое бандл и почему его размер важен](#фундамент)
2. [Как браузер парсит JavaScript](#парсинг)
3. [Стратегии разбивки](#стратегии)
4. [Динамический import() и React.lazy](#динамический-import)
5. [Preload vs Prefetch](#preload-vs-prefetch)
6. [Tree Shaking](#tree-shaking)
7. [Next.js 16: встроенная оптимизация и Turbopack](#nextjs)
8. [Анализ бандла: как найти и исправить проблему](#анализ)
9. [Подводные камни](#подводные-камни)

---

## Фундамент

### Что происходит с JS в браузере

```
Сервер отдаёт .js файл
    ↓
Браузер скачивает (Network)
    ↓
Браузер парсит (Parse) ← CPU-интенсивно
    ↓
Браузер компилирует в байт-код (Compile)
    ↓
Браузер выполняет (Execute) ← CPU-интенсивно
    ↓
Страница интерактивна (TTI - Time to Interactive)
```

**Ключевой инсайт:** Большой JS файл дорог трижды:
1. Долго скачивается (байты)
2. Долго парсится (CPU)
3. Долго компилируется и выполняется (CPU)

### Критические метрики

- **FCP (First Contentful Paint):** Когда пользователь видит первый контент
- **LCP (Largest Contentful Paint):** Когда загружается основной контент
- **TTI (Time to Interactive):** Когда страница реагирует на действия
- **TBT (Total Blocking Time):** Сколько времени main thread был заблокирован

**Большой бандл = высокий TBT = плохой TTI = пользователь думает, что сайт завис.**

### Мобильные устройства — особый контекст

На мобильнике с процессором 2019 года 1MB JS парсится ~5 секунд. На MacBook Pro — ~0.5 секунды. Твоя локальная среда разработки — не репрезентативна.

**В DevTools:** Throttle CPU до 4x slowdown при тестировании.

---

## Парсинг

### Что браузер делает с каждым байтом JS

```
Токенизация → Парсинг в AST → Байткод → Машинный код (JIT)
```

Этот процесс занимает **~1ms на 1KB** на слабом устройстве. 1MB бандл = потенциально 1 секунда только на парсинг.

### Eager vs Lazy Evaluation

```javascript
// Eager: этот код парсится и выполняется при загрузке файла
const result = heavyComputation(); // Блокирует

// Lazy: выполняется только когда нужно
function getResult() {
  return heavyComputation(); // Парсится, но не выполняется сразу
}

// Ещё более lazy: динамический импорт
async function getResult() {
  const { heavyComputation } = await import('./heavy'); // Даже не парсится
  return heavyComputation();
}
```

---

## Стратегии

### 1. Разбивка по роутам (Route-based splitting)

Самая базовая и автоматическая стратегия в Next.js App Router. Каждый `page.tsx` — отдельный чанк.

```
app/
├── page.tsx          → chunk: home.js (~40KB)
├── dashboard/
│   └── page.tsx      → chunk: dashboard.js (~120KB)
└── admin/
    └── page.tsx      → chunk: admin.js (~200KB)

Пользователь посещает "/" → загружается только home.js
```

**Эффект:** 40–60% уменьшение начального бандла для типичных приложений.

### 2. Разбивка по фичам (Feature-based splitting)

Тяжёлые компоненты не нужны при первой загрузке — загружаем их по требованию.

```tsx
// Примеры тяжёлых клиентских компонентов:
// - Rich text editor (Tiptap, Quill, Slate) → 200–400KB
// - PDF viewer (react-pdf) → 300KB+
// - Chart library (Recharts, Chart.js) → 100–200KB
// - Map (Leaflet, Google Maps) → 200KB+
// - Code editor (Monaco, CodeMirror) → 500KB+
// - Date picker → 50–100KB
// - Video player → 100KB+
```

### 3. Разбивка по вендорам (Vendor splitting)

Библиотеки меняются реже, чем твой код. Разделив их в отдельный чанк, браузер может закэшировать их надолго.

**Next.js 16 + Turbopack** делают это **автоматически**. При ручной необходимости конфигурация выглядит иначе в зависимости от bundler'а:

```typescript
// next.config.ts — конфиг Turbopack (Next.js 16 default)
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Turbopack-специфичные оптимизации
  experimental: {
    turbo: {
      // Правила для специфических модулей (если нужно)
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default config;
```

> **Turbopack vs Webpack:** В Next.js 16 Turbopack — bundler по умолчанию для `next dev` и `next build`. Webpack-специфичные API (`config.optimization.splitChunks`) не работают с Turbopack. Для продвинутого управления чанками настраивай Turbopack; Webpack остаётся опцией через `webpack:` в конфиге, но это legacy-путь.

---

## Динамический import()

### Как работает под капотом

```javascript
// Статический импорт: bundler включает модуль в текущий чанк
import { heavyFunction } from './heavy';

// Динамический импорт: bundler создаёт отдельный чанк
const { heavyFunction } = await import('./heavy');
// Эквивалентно:
// 1. Bundler создаёт heavy.chunk.js
// 2. При вызове браузер загружает <script src="heavy.chunk.js">
// 3. Промис резолвится после загрузки и выполнения
```

### React.lazy + Suspense

```tsx
import { lazy, Suspense } from 'react';

// ✅ Базовый паттерн
const HeavyEditor = lazy(() => import('./HeavyEditor'));

function App() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <button onClick={() => setShowEditor(true)}>
        Открыть редактор
      </button>

      {showEditor && (
        <Suspense fallback={<div>Загружаем редактор...</div>}>
          <HeavyEditor />
        </Suspense>
      )}
    </>
  );
}
```

### Умный прелоад при hover

```tsx
// Загружаем компонент при наведении, показываем при клике
// Результат: к моменту клика компонент уже загружен

function SmartLazyButton() {
  const [showModal, setShowModal] = useState(false);
  const [ModalComponent, setModalComponent] = useState<React.ComponentType | null>(null);

  const handleMouseEnter = useCallback(() => {
    import('./HeavyModal').then(module => {
      setModalComponent(() => module.default);
    });
  }, []);

  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onClick={() => setShowModal(true)}
      >
        Открыть
      </button>

      {showModal && ModalComponent && (
        <Suspense fallback={<Spinner />}>
          <ModalComponent onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
}
```

### next/dynamic — паттерны в Next.js

```tsx
import dynamic from 'next/dynamic';

// ✅ Базовое использование с loading fallback
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
});

// ✅ Отключаем SSR (для компонентов с window/document)
const MapComponent = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

// ✅ Именованный экспорт
const SpecificComponent = dynamic(
  () => import('./components').then(mod => mod.SpecificComponent)
);

// ✅ Прелоад при hover — next/dynamic добавляет .preload()
const Modal = dynamic(() => import('./Modal'));

function Page() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onMouseEnter={() => Modal.preload?.()}
        onClick={() => setOpen(true)}
      >
        Открыть
      </button>
      {open && <Modal />}
    </>
  );
}
```

### Соглашение `.client.tsx` — паттерн именования

Для ясного разделения серверных и клиентских модулей используй суффикс `.client.tsx`:

```
components/
├── Calendar.client.tsx      ← 'use client', react-day-picker
├── CalendarLazy.client.tsx  ← dynamic import обёртка
├── RichEditor.client.tsx    ← 'use client', heavy editor
└── Chart.client.tsx         ← 'use client', recharts
```

```tsx
// CalendarLazy.client.tsx — thin wrapper для lazy loading из Server/Client parents
'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const Calendar = dynamic(() => import('./Calendar.client'), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});

export { Calendar as CalendarLazy };
```

> **Важно:** Не вызывай `next/dynamic` из **async Server Component** — может вызывать streaming-ошибки при Turbopack. Используй `dynamic` из синхронного `page.tsx` или клиентских компонентов.

---

## Preload vs Prefetch

Оба атрибута говорят браузеру загрузить ресурс заранее, но с разным приоритетом.

### Preload — Высокий приоритет

```html
<!-- Ресурс нужен СЕЙЧАС, но браузер не знает об этом из HTML -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous">
<link rel="preload" href="/api/critical-data" as="fetch" crossOrigin="anonymous">
```

**Когда использовать:** LCP-изображения, критические шрифты, данные, необходимые для первого рендера.

**Предупреждение:** Unused preload — это предупреждение в консоли и лишний сетевой запрос.

### Prefetch — Низкий приоритет

```html
<!-- Ресурс понадобится при следующей навигации -->
<link rel="prefetch" href="/dashboard.js" as="script">
```

### В Next.js

```tsx
import Link from 'next/link';

// ✅ Next.js Link автоматически prefetch'ит страницы в viewport
<Link href="/dashboard">Dashboard</Link>

// Отключить prefetch (если страница тяжёлая и редко нужна)
<Link href="/heavy-admin" prefetch={false}>Admin</Link>

// Программный prefetch
import { useRouter } from 'next/navigation';
const router = useRouter();
router.prefetch('/dashboard');
```

### В `<head>` через Next.js Metadata

```tsx
// app/layout.tsx
export default function RootLayout() {
  return (
    <html>
      <head>
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>...</body>
    </html>
  );
}
```

---

## Tree Shaking

### Что это

Tree shaking — удаление неиспользуемого кода (dead code elimination) во время сборки. Работает только с ES Modules (`import`/`export`).

### Почему не работает с CommonJS

```javascript
// CommonJS — динамический, анализ невозможен статически
const utils = require('./utils');
const fn = utils[dynamicName]; // Какую функцию мы используем? Неизвестно.
// Весь utils попадает в бандл

// ES Modules — статический, bundler знает точно что нужно
import { specificFunction } from './utils';
// Только specificFunction попадает в бандл
```

### sideEffects в package.json

```json
{
  "name": "my-package",
  "sideEffects": false
}
// Говорит bundler'у: все файлы в пакете — чистые модули без побочных эффектов.

// Если есть файлы с побочными эффектами (CSS, polyfills):
{
  "sideEffects": ["*.css", "./src/polyfills.js"]
}
```

### Проблемы с tree shaking на практике

```tsx
// ❌ Импорт всей библиотеки — tree shaking может не сработать
import _ from 'lodash'; // ~72KB
const result = _.debounce(fn, 300);

// ✅ Точечный импорт — только нужный модуль
import debounce from 'lodash/debounce'; // ~2KB

// ✅ Ещё лучше: используй встроенное
function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// ❌ Iconpack — критическая ошибка!
import * as Icons from 'lucide-react'; // ВСЕ иконки (сотни!)

// ✅ Только нужные иконки
import { Search, User, Settings } from 'lucide-react';
```

### Анализ библиотек перед установкой

**Используй [bundlephobia.com](https://bundlephobia.com) перед `npm install`:**
- Смотри на "Gzipped size" — это реальный вес при передаче
- Смотри на "Tree-shakeable" — можно ли использовать частично
- Сравнивай альтернативы: `date-fns` vs `dayjs` vs `luxon`

---

## Next.js 16

### Автоматическая оптимизация App Router

```
Next.js 16 App Router делает автоматически:
✅ Route-based code splitting (каждый page.tsx — отдельный чанк)
✅ Vendor chunk splitting (React и т.д. кэшируются отдельно)
✅ Prefetch при hover (Link компонент)
✅ Font optimization (next/font — инлайнит critical CSS, убирает FOUT)
✅ Image optimization (next/image — lazy loading, WebP, размеры)
✅ Script optimization (next/script — defer/lazy по умолчанию)
✅ Turbopack — быстрые HMR и incremental builds
```

### Server Components — лучший код-сплиттинг

```tsx
// ✅ Server Component — вообще не попадает в JS бандл клиента
// Это важнее любого dynamic import!

// Если компонент не нужен на клиенте — сделай его Server Component
async function ServerDataTable({ userId }: { userId: string }) {
  const data = await getUserData(userId); // Серверный вызов

  return (
    <table>
      {data.map(row => <tr key={row.id}><td>{row.name}</td></tr>)}
    </table>
  );
}
// Весь код этого компонента остаётся на сервере.
// В JS-бандл клиента не попадает ничего.
```

**Правило:** Сначала спроси «Может ли это быть Server Component?» — и только потом рассматривай `dynamic`.

### Recharts и другие «тяжёлые» клиентские библиотеки

```tsx
// ❌ ОШИБКА: Recharts — это client-only библиотека!
// Она использует SVG DOM APIs и не работает как Server Component.

// ✅ Правильно: dynamic import с ssr: false
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(
  () => import('./RevenueChart.client'),
  { ssr: false, loading: () => <Skeleton className="h-64" /> }
);

// RevenueChart.client.tsx:
'use client';
import { BarChart, Bar, XAxis } from 'recharts';

export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <BarChart data={data} width={600} height={300}>
      <Bar dataKey="value" />
      <XAxis dataKey="name" />
    </BarChart>
  );
}
```

### optimizePackageImports (Next.js 16)

Для популярных библиотек с barrel-файлами:

```typescript
// next.config.ts
const config: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'date-fns'],
  },
};
```

---

## Анализ

### Шаг 1: @next/bundle-analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  // ...твой конфиг
});
```

```bash
ANALYZE=true npm run build
# Открывает интерактивную карту чанков в браузере
```

### Шаг 2: Что искать в бандл-анализаторе

```
Красные флаги:
🔴 Один огромный квадрат (>50KB) — кандидат на dynamic import
🔴 Один и тот же модуль в нескольких чанках — нужен shared chunk
🔴 Незнакомая библиотека большого размера — investigate
🔴 Moment.js — заменить на date-fns/dayjs (Moment тащит все локали)
🔴 lodash целиком — использовать точечные импорты
🔴 Клиентская библиотека в серверном чанке — нужен ssr: false или Server Component
```

### Шаг 3: Lighthouse

```bash
# В Chrome DevTools → Lighthouse → Performance
# Смотреть:
# - Total Blocking Time (TBT) < 300ms
# - Time to Interactive (TTI) < 3.8s
# - Unused JavaScript → кандидаты на lazy load
```

---

## Подводные камни

### Слишком много мелких чанков (HTTP/1.1)

```
HTTP/1.1: максимум 6 одновременных соединений к домену
100 чанков по 5KB = 100 запросов ≈ 100/6 = ~17 "волн" запросов
Это МЕДЛЕННЕЕ, чем 1 файл 500KB

HTTP/2: мультиплексирование, можно иметь много мелких чанков
HTTP/3 (QUIC): ещё лучше

Практика: оптимальный размер чанка — 20–50KB gzip
```

### Dynamic import уничтожает tree shaking при неправильном использовании

```tsx
// ❌ Bundler не может tree-shake динамический импорт namespace
const allComponents = await import('./components'); // Весь файл
const { Button } = allComponents;

// ✅ Конкретный файл
const { Button } = await import('./components/Button');
```

### React.lazy и Error Boundaries

```tsx
// Обязательно оборачивай lazy компоненты в Error Boundary
// Если чанк не загрузился (нет интернета, 404) — нужна обработка

import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div>
          Не удалось загрузить компонент.
          <button onClick={() => window.location.reload()}>Повторить</button>
        </div>
      }
    >
      <Suspense fallback={<Spinner />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Производительность в числах

| Действие | Примерный эффект |
|---------|----------------|
| Route-based splitting | −40–60% initial bundle |
| Убрать Moment.js | −67KB gzip |
| lodash → точечные импорты | −50–65KB gzip |
| Перенести компонент в Server Component | −N% client bundle |
| Dynamic import для rich editor | −200–400KB initial |
| Оптимизировать иконки | −10–50KB |

> **Senior-мышление:** Оптимизация бандла — это не «сделать один раз и забыть». Это процесс: build → measure → identify → optimize → repeat. Без измерений оптимизация вслепую. И помни: **самый маленький клиентский бандл — это Server Component**.
