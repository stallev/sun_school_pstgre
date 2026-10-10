# Браузерный рендеринг: Reflow, Repaint и Composition

> Стек: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4

---

## Оглавление

1. [Фундамент: Pixel Pipeline](#фундамент)
2. [Layout (Reflow)](#layout-reflow)
3. [Paint (Repaint)](#paint-repaint)
4. [Composition](#composition)
5. [Layout Thrashing](#layout-thrashing)
6. [will-change и слои GPU](#will-change)
7. [Анимации: правильный подход](#анимации)
8. [React 19 и рендеринг браузера](#react)
9. [Профилирование в DevTools](#профилирование)
10. [Практический чеклист](#чеклист)

---

## Фундамент

### Pixel Pipeline — полный цикл

```
JS → Style → Layout → Paint → Composite
```

Каждый раз, когда ты меняешь DOM или CSS, браузер потенциально проходит через этот конвейер. Задача оптимизации — минимизировать количество этапов.

```
Изменил transform/opacity?
→ Composite (самый быстрый путь) ✅

Изменил color/background?
→ Paint → Composite

Изменил width/height/margin?
→ Layout → Paint → Composite (самый дорогой путь) ❌
```

### Главный поток vs GPU

```
Главный поток (CPU):
- JavaScript
- Style calculation
- Layout
- Paint

GPU (compositor thread):
- Composite
- Transform анимации
- Opacity анимации

Ключевое: GPU-операции не блокируют JS!
```

Если анимация выполняется на GPU — она будет плавной, даже если JS занят тяжёлой работой.

---

## Layout (Reflow)

### Что триггерит Layout

```css
/* Изменение любого из этих свойств → Reflow */
width, height, min-width, max-width
margin, padding, border
top, right, bottom, left (для positioned elements)
font-size, font-family, line-height
display, position, float, clear
overflow, white-space
```

### Масштаб Reflow

Reflow — не всегда глобальная операция. Масштаб зависит от того, что изменилось:

```
Глобальный Reflow (перерасчёт всей страницы):
- Изменение viewport (resize окна)
- Изменение шрифтов
- Добавление/удаление глобальных стилей

Локальный Reflow:
- Изменение стилей конкретного элемента
- Может распространяться на потомков и иногда предков
```

### Какие операции читают геометрию (форсируют Reflow)

```javascript
// Эти свойства и методы заставляют браузер немедленно пересчитать Layout
// даже если он это не планировал

element.offsetTop, offsetLeft, offsetWidth, offsetHeight
element.scrollTop, scrollLeft, scrollWidth, scrollHeight
element.clientTop, clientLeft, clientWidth, clientHeight
element.getBoundingClientRect()
element.getClientRects()
window.innerWidth, innerHeight
window.getComputedStyle()
document.elementFromPoint()
```

**Почему это важно:** Когда ты пишешь CSS через JS, браузер «ленится» и откладывает Reflow. Но как только ты читаешь геометрические свойства — он вынужден сделать Reflow немедленно, чтобы дать актуальные значения.

---

## Paint (Repaint)

### Что триггерит Paint (но не Layout)

```css
/* Только Paint, не Reflow */
color
background, background-color, background-image
border-color (если размер не меняется)
box-shadow
outline-color
text-decoration
visibility: hidden → visible (но display: none → block — Reflow!)
```

### display: none vs visibility: hidden — важное различие

```tsx
{/* display: none → Reflow: элемент удаляется из потока документа */}
<div style={{ display: isHidden ? 'none' : 'block' }}>Контент</div>

{/* visibility: hidden → Repaint: элемент занимает место, но невидим */}
<div style={{ visibility: isHidden ? 'hidden' : 'visible' }}>Контент</div>

{/* opacity: 0 → Composite: только прозрачность, в потоке, кликабелен! */}
<div style={{ opacity: isHidden ? 0 : 1 }}>Контент</div>
```

**Практическое правило:**
- `display: none` — для элементов, которые физически убираются из UI
- `visibility: hidden` — когда нужно сохранить место
- `opacity: 0` + `pointer-events: none` — для анимированных переходов

---

## Composition

### Что такое слои (Layers)

Браузер делит страницу на слои (layers). Каждый слой рисуется независимо и финально собирается compositor thread на GPU.

```
Layer 1: Body (основной контент)
Layer 2: Sticky header (position: sticky)
Layer 3: Animated element (will-change: transform)
Layer 4: Modal overlay
```

**Преимущество:** Если меняется только Layer 3 — браузер перерисовывает только его и перекомпозирует. Layer 1 не трогается.

### Как создаются слои

Браузер автоматически создаёт слой для:
```css
transform: translateZ(0);  /* Hack из прошлого — не используй */
will-change: transform;    /* Современный способ */
position: fixed;
position: sticky;
opacity < 1;
filter: ...;
isolation: isolate;
```

---

## Layout Thrashing

### Что это

Layout Thrashing (или Forced Synchronous Layout) — ситуация, когда браузер вынужден делать Reflow многократно за один frame, потому что код чередует чтение и запись геометрических свойств.

### Пример с багом

```javascript
// ❌ Классический Layout Thrashing
const boxes = document.querySelectorAll('.box');

boxes.forEach(box => {
  // 1. ЧИТАЕМ: браузер делает Reflow #1
  const width = box.offsetWidth;

  // 2. ПИШЕМ: помечает Layout как "грязный"
  box.style.width = (width * 2) + 'px';

  // 3. На следующей итерации снова ЧИТАЕМ → Reflow #2
  // И так 100 раз для 100 элементов
});
// Итого: N * Reflow → очень медленно
```

### Решение: Read-Write разделение

```javascript
// ✅ Сначала все чтения, потом все записи
const boxes = document.querySelectorAll('.box');

// Фаза READ: один Reflow в начале
const widths = Array.from(boxes).map(box => box.offsetWidth);

// Фаза WRITE: браузер делает один Reflow в конце frame
boxes.forEach((box, i) => {
  box.style.width = (widths[i] * 2) + 'px';
});
// Итого: 1 Reflow → быстро
```

### Layout Thrashing в React

```tsx
// ❌ Layout Thrashing в useEffect
useEffect(() => {
  const items = document.querySelectorAll('.item');
  items.forEach(item => {
    const height = item.offsetHeight; // Read
    item.style.transform = `translateY(${height}px)`; // Write → Thrashing!
  });
});

// ✅ Через ResizeObserver
useEffect(() => {
  const observer = new ResizeObserver(entries => {
    // ResizeObserver вызывается после Layout — безопасно читать
    entries.forEach(entry => {
      const height = entry.contentRect.height;
      (entry.target as HTMLElement).style.setProperty('--height', `${height}px`);
    });
  });

  document.querySelectorAll('.item').forEach(item => observer.observe(item));
  return () => observer.disconnect();
}, []);
```

---

## will-change

### Для чего нужен

`will-change` — это подсказка браузеру: «этот элемент скоро изменится, подготовь для него отдельный слой заранее».

```css
/* Браузер создаёт GPU-слой заранее */
.animated-card {
  will-change: transform;
}

/* При анимации — никакого Reflow/Repaint, только Composite */
.animated-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
```

### Подводные камни will-change

```css
/* ❌ НЕ ДЕЛАЙ ТАК — применяй ко всем элементам */
* {
  will-change: transform; /* Огромное потребление памяти */
}

/* ❌ НЕ оставляй постоянно на статичных элементах */
.card {
  will-change: transform; /* Всегда занимает слой, даже без анимации */
}

/* ✅ Добавляй перед анимацией, убирай после */
function animateCard(element: HTMLElement) {
  element.style.willChange = 'transform';

  element.animate([
    { transform: 'translateY(0)' },
    { transform: 'translateY(-4px)' },
  ], {
    duration: 200,
    fill: 'forwards',
  }).addEventListener('finish', () => {
    element.style.willChange = 'auto'; // Освобождаем слой
  });
}

/* ✅ Для постоянных анимаций — нормально держать */
.spinner {
  will-change: transform; /* Крутится всегда — слой оправдан */
  animation: spin 1s linear infinite;
}
```

### Сколько слоёв допустимо

Каждый слой потребляет GPU-память (VRAM). На мобильниках VRAM ограничена. Правило: создавай слои только там, где это реально ускоряет анимации.

---

## Анимации

### Три уровня производительности

```css
/* Уровень 1: Только Composite — идеально для анимаций */
.smooth {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-10px); opacity: 0.8; }
}

/* Уровень 2: Paint — приемлемо для редких анимаций */
.color-change {
  transition: background-color 0.3s; /* Paint, не Reflow */
}

/* Уровень 3: Reflow — избегать в анимациях */
.bad-animation {
  /* ❌ Вызывает Reflow на каждом кадре */
  transition: width 0.3s, height 0.3s, margin 0.3s;
}
```

### Правильный способ делать сложные визуальные эффекты

```css
/* Хочешь изменить размер элемента плавно? */

/* ❌ Анимировать width/height → Reflow */
.card {
  width: 200px;
  transition: width 0.3s;
}
.card:hover {
  width: 250px; /* Reflow на каждом кадре! */
}

/* ✅ Анимировать transform: scale → Composite */
.card {
  width: 200px;
  transform-origin: left center;
  transition: transform 0.3s;
}
.card:hover {
  transform: scaleX(1.25); /* Только Composite! */
}
```

### FLIP техника (First Last Invert Play)

Для анимации изменений layout (например, перемещение карточки в списке):

```typescript
async function animateLayoutChange(element: HTMLElement, callback: () => void) {
  // First: записываем начальную позицию
  const first = element.getBoundingClientRect();

  // Выполняем изменение DOM
  callback();

  // Last: записываем конечную позицию
  const last = element.getBoundingClientRect();

  // Invert: применяем transform чтобы элемент выглядел в начальной позиции
  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;

  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  element.style.transition = 'none';

  // Форсируем применение стилей
  element.getBoundingClientRect(); // Намеренный Reflow для flush

  // Play: анимируем к финальной позиции (убираем transform)
  element.style.transition = 'transform 0.3s ease';
  element.style.transform = '';
}
```

---

## React 19

### Как React взаимодействует с Pixel Pipeline

```
React State Change
    ↓
Virtual DOM Reconciliation (JS, в памяти)
    ↓
Minimal DOM mutations (только изменения)
    ↓
Browser Pixel Pipeline (Layout → Paint → Composite)
```

React уменьшает количество DOM-мутаций через reconciliation, но не отменяет Pixel Pipeline. Каждая мутация DOM может триггерить Reflow/Repaint.

### useLayoutEffect vs useEffect

```tsx
// useEffect: выполняется ПОСЛЕ браузерного рендеринга (async)
// Подходит для: API запросы, подписки, логирование
useEffect(() => {
  fetchData();
}, []);

// useLayoutEffect: выполняется ДО браузерного рендеринга (sync)
// Подходит для: DOM-измерения, предотвращение мерцания
useLayoutEffect(() => {
  // Этот код выполняется после DOM-мутаций React,
  // но ДО того как браузер отрисует на экран
  const width = ref.current.offsetWidth;
  setWidth(width); // Не вызывает мерцания
}, []);

// Пример: тултип, который нужно позиционировать
function Tooltip({ target }: { target: HTMLElement }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current!.getBoundingClientRect();
    setPosition({
      top: rect.top - tooltipRect.height - 8,
      left: rect.left + rect.width / 2 - tooltipRect.width / 2,
    });
  }, [target]);

  return (
    <div
      ref={tooltipRef}
      style={{ position: 'fixed', top: position.top, left: position.left }}
    >
      Подсказка
    </div>
  );
}
```

### React 19: автоматическое батчинг обновлений

В React 18+ **все обновления батчатся автоматически** — включая async-контекст. В React 19 это работает везде, в том числе в `startTransition` с async-функциями:

```tsx
// React 19: startTransition принимает async-функцию напрямую
import { useTransition } from 'react';

function SaveForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await saveToServer(formData); // Ждём завершения
      setSuccess(true);             // Эти обновления
      setCount(prev => prev + 1);   // батчатся в один render
    });
  }

  return (
    <form action={handleSubmit}>
      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? 'Сохраняем...' : 'Сохранить'}
      </button>
    </form>
  );
}
```

### CSS-переменные и React

```tsx
// Вместо inline-стилей для анимаций — CSS-переменные
// React обновляет CSS-переменную → браузер применяет стиль → GPU рисует

function AnimatedProgress({ value }: { value: number }) {
  return (
    <div
      className="progress-bar"
      style={{ '--progress': `${value}%` } as React.CSSProperties}
    />
  );
}

// CSS (Tailwind v4 позволяет это в @layer):
// .progress-bar::after {
//   /* ✅ Анимировать через transform — Composite, не Reflow */
//   transform: scaleX(calc(var(--progress) / 100));
//   transform-origin: left;
//   transition: transform 0.3s ease;
// }
```

### Tailwind v4: анимации через arbitrary values и CSS vars

```tsx
// Tailwind v4 поддерживает CSS-переменные в utility классах
function Card({ delay }: { delay: number }) {
  return (
    <div
      className="transition-transform duration-300 hover:-translate-y-1"
      style={{ '--enter-delay': `${delay}ms` } as React.CSSProperties}
    >
      {/* ✅ translate-y использует transform → Composite */}
    </div>
  );
}

// В CSS (globals.css или @layer utilities):
// .animate-enter {
//   animation: enter 0.3s ease var(--enter-delay, 0ms) both;
// }
// @keyframes enter {
//   from { opacity: 0; transform: translateY(8px); }
//   to   { opacity: 1; transform: translateY(0); }
// }
```

---

## Профилирование

### Chrome DevTools Performance Tab

```
Запись профиля:
1. DevTools → Performance → Record
2. Выполни действие (scroll, animation, click)
3. Stop

Что искать:
🔴 Красные блоки в Main thread → Long Tasks (>50ms)
🟡 "Layout" события → Reflow
🟡 "Paint" события → Repaint
🟢 "Composite Layers" → GPU, хорошо

Flame chart (снизу вверх):
- requestAnimationFrame
  - JS код
    - Style recalculation
      - Layout ← Если здесь, то Reflow
        - Paint ← Если здесь, то Repaint
```

### Rendering Tab

```
DevTools → три точки → More tools → Rendering

Полезные опции:
✅ Paint flashing: подсвечивает области перерисовки (зелёным)
✅ Layout Shift Regions: показывает CLS
✅ FPS meter: метроном производительности
✅ Layer borders: показывает GPU слои
```

### Performance Monitor

```
DevTools → три точки → More tools → Performance Monitor

Смотри в реальном времени:
- CPU usage: >80% — проблема
- JS heap size: растёт без возврата → memory leak
- Layouts/sec: много → Layout Thrashing
- Style recalcs/sec: много → ненужные перерасчёты
```

---

## Чеклист

**Анимации:**
- [ ] Анимируешь только `transform` и `opacity`
- [ ] Не анимируешь `width`, `height`, `top`, `left`, `margin`
- [ ] `will-change` добавлен только для постоянно анимируемых элементов
- [ ] Убираешь `will-change` после завершения анимации

**Layout:**
- [ ] Разделил чтение и запись геометрических свойств
- [ ] Нет чередования read/write в циклах
- [ ] Используешь CSS-переменные вместо inline-стилей где возможно

**React 19:**
- [ ] `useLayoutEffect` для DOM-измерений (не `useEffect`)
- [ ] Не вызываешь `getBoundingClientRect()` в render
- [ ] CSS-переменные для динамических стилей анимаций
- [ ] `startTransition` с async для неблокирующих мутаций

**Производительность:**
- [ ] Проверил в Performance Tab с CPU throttle 4x
- [ ] Включил Paint flashing и убедился в отсутствии избыточных repaint
- [ ] LCP, TTI, TBT в приемлемых пределах (Lighthouse ≥ 90)

**Общее понимание (для Senior):**

| CSS свойство | Триггерит |
|-------------|----------|
| width, height, margin, padding | Layout + Paint + Composite |
| top, left (position) | Layout + Paint + Composite |
| color, background | Paint + Composite |
| box-shadow | Paint + Composite |
| visibility | Paint + Composite |
| transform | Composite only ✅ |
| opacity | Composite only ✅ |
| filter | Composite only ✅ |
| display: none → block | Layout + Paint + Composite |

> **Senior-отличие:** Смотришь на любую CSS-анимацию и мгновенно знаешь, на каком этапе Pipeline она работает. Видишь код с `offsetWidth` в цикле — автоматически замечаешь Layout Thrashing. Используешь Performance Tab как основной инструмент диагностики, а не только «на интуицию».
