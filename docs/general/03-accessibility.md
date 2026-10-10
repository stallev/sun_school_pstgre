# Доступность (A11y): от основ до Senior-уровня

> Стек: Next.js 16 (App Router), React 19, TypeScript, Radix UI / shadcn/ui

---

## Оглавление

1. [Зачем это важно (не только этика)](#зачем)
2. [Фундамент: ARIA, семантика, дерево доступности](#фундамент)
3. [Управление фокусом](#управление-фокусом)
4. [Модальное окно: разбор по косточкам](#модальное-окно)
5. [Клавиатурная навигация](#клавиатурная-навигация)
6. [Визуальные требования](#визуальные-требования)
7. [A11y в Next.js 16 и React 19](#nextjs-и-react-19)
8. [Mutations и pending-состояния](#mutations-и-pending)
9. [Тестирование доступности](#тестирование)

---

## Зачем

**Бизнес-причины:**
- 15–20% населения имеют те или иные ограничения — это потенциальные пользователи
- Accessibility = SEO (семантический HTML, структура заголовков индексируется)
- Юридические риски: ADA (США), EN 301 549 (ЕС) — иски реальны
- Клавиатурная навигация удобна всем: power users, vim-пользователи, пользователи без мыши

**Техническая причина:** Код, который корректно работает со скринридерами, как правило, хорошо структурирован. Это дисциплинирует архитектуру.

---

## Фундамент

### Дерево доступности (Accessibility Tree)

Браузер строит два дерева из HTML: DOM Tree и Accessibility Tree. Скринридеры работают со вторым.

```
HTML:              DOM Tree:          Accessibility Tree:
<nav>              nav                landmark: navigation
  <a href="/">       a[href="/"]        link: "Главная"
    Главная        <-- text -->
  </a>
  <button>           button             button: "Меню"
    Меню
  </button>
</nav>
```

**Что попадает в Accessibility Tree:**
- Семантические HTML-элементы (button, a, input, nav, main...)
- ARIA-атрибуты
- Видимый текст

**Что НЕ попадает:**
- `aria-hidden="true"` элементы
- `display: none` элементы
- `visibility: hidden` элементы
- CSS-псевдоэлементы (`::before`, `::after`)

### Семантический HTML — всегда первый выбор

```tsx
// ❌ Div-суп — не доступен
<div className="button" onClick={submit}>Отправить</div>

// ✅ Семантический элемент
<button type="submit">Отправить</button>
```

Нативный `<button>`:
- Фокусируется с клавиатуры
- Активируется Enter и Space
- Имеет role="button" в Accessibility Tree
- Поддерживает `disabled`

**Если всё же нужен кастомный элемент:**
```tsx
// Нужно воссоздать ВСЁ поведение нативной кнопки вручную
<div
  role="button"
  tabIndex={0}
  aria-pressed={isPressed}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }}
  onClick={onClick}
>
  Кастомная кнопка
</div>
```

Видишь, сколько кода? Используй `<button>`.

### ARIA: роли, состояния, свойства

ARIA не добавляет функциональность — только описывает элемент для вспомогательных технологий.

**Три категории ARIA:**

```html
<!-- Роли (role) — что это такое -->
<div role="dialog">...</div>
<div role="listbox">...</div>
<div role="tab">...</div>

<!-- Свойства (aria-*) — характеристики -->
<input aria-label="Поиск по сайту" />
<button aria-expanded="true">Меню</button>
<div aria-labelledby="dialog-title">...</div>

<!-- Состояния (aria-*) — текущее состояние -->
<button aria-pressed="true">Жирный текст</button>
<div aria-busy="true">Загрузка...</div>
<input aria-invalid="true" />
```

**Правило:** Используй нативный HTML везде, где можешь. ARIA — только когда нативных элементов недостаточно.

---

## Управление фокусом

### Почему это важно

Пользователи клавиатуры и скринридеров навигируют через фокус. Если фокус «теряется» или попадает не туда — они дезориентированы.

### Focus Trap (Ловушка фокуса)

В модальных окнах, боковых панелях, дропдаунах фокус не должен выходить за пределы компонента.

```typescript
// lib/focus-trap.ts

export function createFocusTrap(container: HTMLElement) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
      .filter(el => !el.hidden && el.offsetParent !== null);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return {
    activate() {
      document.addEventListener('keydown', handleKeyDown);
      const focusable = getFocusableElements();
      focusable[0]?.focus();
    },
    deactivate() {
      document.removeEventListener('keydown', handleKeyDown);
    },
  };
}
```

### Восстановление фокуса

```typescript
// hooks/use-focus-restore.ts
import { useRef, useEffect } from 'react';

export function useFocusRestore(isOpen: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Запоминаем элемент, который открыл компонент
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      // Возвращаем фокус при закрытии
      triggerRef.current?.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);
}
```

### inert vs aria-hidden

```tsx
// ❌ aria-hidden: скрывает от скринридеров, но фокус всё ещё проходит
<div aria-hidden="true">
  <button>Можно сфокусироваться с клавиатуры!</button> {/* Проблема */}
</div>

// ✅ inert: блокирует фокус, клики И скринридеры
<div inert={isModalOpen ? true : undefined}>
  <main>Фоновый контент</main>
</div>

// В TypeScript нужно расширить типы:
declare module 'react' {
  interface HTMLAttributes<T> {
    inert?: '' | undefined;
  }
}
```

**Когда использовать:**
- `aria-hidden="true"` — декоративные элементы (иконки с подписями)
- `inert` — фоновый контент за модалкой, неактивные панели

---

## Модальное окно

### Радикально проще: Radix UI / shadcn/ui

Написать полностью доступное модальное окно с нуля — это ~200 строк: focus trap, Escape, scroll lock, aria-labelledby, восстановление фокуса, aria-modal. В **Radix UI** (лежит в основе shadcn/ui) всё это есть из коробки.

```tsx
// ✅ Правильный путь — Radix Dialog (shadcn/ui обёртка)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтвердите удаление</DialogTitle> {/* ✅ aria-labelledby */}
          <DialogDescription>
            Это действие необратимо. {/* ✅ aria-describedby */}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-4">
          <button onClick={() => onOpenChange(false)}>Отмена</button>
          <button onClick={onConfirm} className="bg-red-500 text-white">
            Удалить
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Radix UI автоматически обеспечивает:
- `role="dialog"` и `aria-modal="true"`
- Focus trap внутри диалога
- Escape закрывает
- Восстановление фокуса на trigger
- Блокировку прокрутки body
- `aria-labelledby` через `DialogTitle`

### Кнопка закрытия с иконкой — обязательный aria-label

```tsx
// ❌ Иконка без текстового описания
<DialogClose>
  <XIcon />
</DialogClose>

// ✅ Иконка с aria-label
<DialogClose asChild>
  <button aria-label="Закрыть диалог">
    <XIcon aria-hidden="true" /> {/* ✅ Иконка декоративная */}
  </button>
</DialogClose>
```

### Когда писать Modal с нуля

Radix UI недостаточен в очень редких случаях: сложные составные диалоги с нестандартным поведением фокуса, интеграция с третьими библиотеками. В этом случае используй логику из раздела «Управление фокусом» выше.

---

## Клавиатурная навигация

### Табиндекс и его правила

```tsx
// tabIndex не задан / tabIndex={0}
// → элемент в естественном порядке DOM (кнопки, ссылки — по умолчанию)

// tabIndex={-1}
// → не в Tab-порядке, но фокусируется программно

// tabIndex={n > 0}  ← НИКОГДА ТАК НЕ ДЕЛАЙ
// → ломает естественный порядок, создаёт проблемы для всех
```

### Keyboard Pattern для кастомных компонентов

Для сложных виджетов (табы, дропдауны, datepicker) ARIA имеет стандартные клавиатурные паттерны:

```tsx
// Пример: Tab-компонент (roving tabindex паттерн)
function TabList({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    setActiveTab(newIndex);
    tabRefs.current[newIndex]?.focus();
  }

  return (
    <div role="tablist" aria-label="Разделы настроек">
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={el => { tabRefs.current[i] = el; }}
          role="tab"
          aria-selected={activeTab === i}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          tabIndex={activeTab === i ? 0 : -1} // Roving tabindex
          onClick={() => setActiveTab(i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

---

## Визуальные требования

### Focus Indicator

```css
/* ❌ Никогда не убирай outline без замены */
button:focus {
  outline: none; /* Пользователи клавиатуры не видят фокус */
}

/* ✅ Кастомный, но заметный focus indicator */
button:focus-visible {
  /* focus-visible — только при навигации с клавиатуры, не при клике мышью */
  outline: 2px solid #0066cc;
  outline-offset: 2px;
  border-radius: 4px;
}
```

**В Tailwind CSS:**
```tsx
<button className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
```

### Контраст текста

| Размер текста | Минимум (AA) | Улучшенный (AAA) |
|---------------|-------------|-----------------|
| Обычный (<18px) | 4.5:1 | 7:1 |
| Крупный (≥18px или ≥14px bold) | 3:1 | 4.5:1 |
| Иконки / декоративные | Не требуется | — |

**Инструмент:** [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)

### Минимальная зона клика

**WCAG 2.5.5:** Интерактивные элементы должны иметь зону клика минимум 44×44px.

```tsx
// ❌ Иконка-кнопка без достаточной зоны
<button>
  <XIcon className="w-4 h-4" />
</button>

// ✅ Паддинги увеличивают зону клика
<button className="flex items-center justify-center min-w-[44px] min-h-[44px]">
  <XIcon className="w-4 h-4" aria-hidden="true" />
</button>
```

### Движение и анимации

```css
/* Для пользователей с вестибулярными нарушениями */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// В React:
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

---

## Next.js 16 и React 19

### Автоматические преимущества

```tsx
// Next.js Link — доступен из коробки
import Link from 'next/link';

// ✅ Корректный тег <a>, работает с клавиатурой
<Link href="/about">О нас</Link>
```

### Async Request APIs — всегда await (Next.js 16)

```typescript
// Next.js 16: cookies(), headers(), params, searchParams — асинхронные
import { cookies, headers } from 'next/headers';

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q: string }>;
}) {
  const { id } = await props.params;
  const { q } = await props.searchParams;
  const lang = (await headers()).get('accept-language');
  // ...
}
```

### Skip Navigation Link

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru"> {/* ✅ Язык обязателен для скринридеров */}
      <body>
        {/* ✅ Skip link — первый элемент на странице */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                     bg-white px-4 py-2 z-50 rounded shadow-lg"
        >
          Перейти к основному содержимому
        </a>

        <Header />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

### Radix UI + shadcn/ui — доступность из коробки

Radix UI строит доступность в основу каждого примитива:

```tsx
// Radix Dialog — корректный role="dialog", focus trap, Escape, aria-labelledby
import * as Dialog from '@radix-ui/react-dialog';

// ❌ НЕ убирай эти атрибуты в кастомизации
<Dialog.Title> {/* Обязателен! Это aria-labelledby */}
<Dialog.Description> {/* Опционален, но важен */}

// ✅ Кнопка закрытия без видимого текста ТРЕБУЕТ aria-label
<Dialog.Close asChild>
  <button aria-label="Закрыть">
    <X aria-hidden="true" />
  </button>
</Dialog.Close>
```

**Radix UI даёт:** Dialog, Sheet, Select, Tabs, Dropdown, Tooltip, Popover, AlertDialog — все с полной ARIA и keyboard support. Используй их перед кастомными решениями.

---

## Mutations и pending-состояния

### aria-busy и disabled при мутациях

Когда пользователь отправляет форму или нажимает кнопку мутации — UI должен явно сигнализировать о pending-состоянии. Это важно не только визуально, но и для screen readers.

```tsx
'use client';

import { useTransition } from 'react';

function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await onSave();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}         // ✅ Блокируем повторный клик
      aria-busy={isPending}        // ✅ Screen reader знает о загрузке
    >
      {isPending ? 'Сохранение...' : 'Сохранить'} {/* ✅ Текст меняется */}
    </button>
  );
}
```

### useActionState — для форм (React 19)

```tsx
'use client';

import { useActionState } from 'react';

type FormState = { error?: string; success?: boolean };

function ProfileForm({ saveAction }: { saveAction: (prev: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, action, isPending] = useActionState(saveAction, {});

  return (
    <form action={action}>
      <input
        name="name"
        aria-invalid={!!state.error}                // ✅ Поле отмечено как невалидное
        aria-describedby={state.error ? 'name-error' : undefined}
      />
      {state.error && (
        <span id="name-error" role="alert">         {/* ✅ role="alert" объявит ошибку SR */}
          {state.error}
        </span>
      )}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}
```

### aria-live для динамических обновлений

```tsx
// Результаты поиска, статусы, notifications — нужен aria-live
function SearchStatus({ count, isLoading }: { count: number; isLoading: boolean }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {isLoading ? 'Поиск...' : `Найдено ${count} результатов`}
    </div>
  );
}

// aria-live="assertive" — для критических ошибок (прерывает чтение SR)
function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert"> {/* role="alert" = aria-live="assertive" + aria-atomic="true" */}
      {message}
    </div>
  );
}
```

---

## Тестирование

### Автоматизированные инструменты (находят ~30–40% проблем)

```bash
# axe-core для тестирования в CI
npm install --save-dev @axe-core/playwright

# В Playwright-тестах:
import AxeBuilder from '@axe-core/playwright';

test('should not have any automatically detectable accessibility issues', async ({ page }) => {
  await page.goto('/');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

> **Next.js 16:** нет `_app.tsx`. Для dev-only axe используй отдельный dev-компонент в root layout, условно импортированный через `next/dynamic` с `ssr: false`.

### Ручное тестирование (обязательно)

1. **Только клавиатура:** Отключи мышь. Пройди весь сценарий Tab→Enter/Space
2. **Скринридер:** NVDA + Firefox (Windows), VoiceOver + Safari (Mac/iOS)
3. **Zoom до 200%:** Проверь, что layout не ломается
4. **High Contrast режим:** Windows → Настройки → Специальные возможности

### Чеклист для каждого компонента

- [ ] Все интерактивные элементы доступны с клавиатуры
- [ ] Focus indicator видим на всех интерактивных элементах (`focus-visible:`)
- [ ] Иконки-кнопки имеют `aria-label`
- [ ] Декоративные изображения имеют `alt=""`
- [ ] Информационные изображения имеют описательный `alt`
- [ ] Формы: `<label>` связан с `<input>` через `htmlFor`/`id`
- [ ] Ошибки форм связаны с полями через `aria-describedby`
- [ ] Модалки: через Radix/shadcn; или role, aria-modal, focus trap, Escape вручную
- [ ] Динамические обновления используют `aria-live` / `role="alert"`
- [ ] Мутации: `disabled` + `aria-busy` на кнопке во время pending
- [ ] Один `<h1>` на страницу; иерархия h1→h2→h3 без пропусков
- [ ] `lang` атрибут на `<html>` соответствует языку контента
