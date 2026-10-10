# Security: XSS, CSRF, CSP — agent guidelines

**Stack:** Next.js **16.4** App Router, React 19, Auth.js v5  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Deep dive:** [`docs/general/01-security-xss-csrf.md`](../../general/01-security-xss-csrf.md)  
**Cursor rule:** **security-xss-csrf** · **auth-security** (auth layers)  
**Runtime:** [ADR-002](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) — CSP in **`proxy.ts`**

AI agents **MUST** apply defense in depth — несколько слоёв, не одна мера.

---

## 1. XSS — agent contract

### MUST

| Rule | Detail |
|------|--------|
| **JSX escaping** | User/API strings in `{text}` — React escapes by default; не обходить без причины |
| **dangerouslySetInnerHTML** | Только с **`isomorphic-dompurify`** (SSR-safe); whitelist tags/attrs |
| **Sanitize on write** | Rich text — санитайз в Server Action **до** записи в БД, не только при render |
| **href/src validation** | Блокировать `javascript:` и небезопасные URL в user-controlled `href` |
| **CSP** | Nonce per-request в **`proxy.ts`** → `x-nonce` header → `Script` / inline styles |
| **httpOnly cookies** | Сессия через Auth.js — не дублировать cookie logic; Auth.js выставляет `httpOnly`, `secure`, `sameSite` |

### MUST NOT

- `innerHTML`, `document.write`, `eval`, `new Function(userInput)` с пользовательскими данными
- `dangerouslySetInnerHTML` без DOMPurify для user-generated HTML
- Хранить сессию в `localStorage` / доступной JS cookie

### Rich text pattern

```tsx
import DOMPurify from "isomorphic-dompurify";

const clean = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "a", "ul", "li"],
  ALLOWED_ATTR: ["href", "target", "rel"],
});

return <div dangerouslySetInnerHTML={{ __html: clean }} />;
```

---

## 2. CSRF — agent contract

### MUST

| Rule | Detail |
|------|--------|
| **SameSite cookies** | `sameSite: 'lax'` minimum (Auth.js default) |
| **Server Actions for forms** | Origin check встроен в Next.js — предпочитать Actions для state-changing forms |
| **Route Handlers** | На POST/PUT/PATCH/DELETE — проверять `Origin` / `Referer` vs `NEXT_PUBLIC_APP_URL` |
| **Auth in every mutation** | CSRF-защита ≠ авторизация; всегда `auth()` + policy в Action/Handler |

### SHOULD

- `experimental.serverActions.allowedOrigins` в `next.config.ts` при reverse-proxy/CDN
- CSRF tokens — только для legacy (subdomains, WebView, partner API)

---

## 3. CSP in proxy.ts (Next.js 16)

```typescript
// apps/web/src/proxy.ts — excerpt pattern
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
  style-src 'self' 'nonce-${nonce}';
  img-src 'self' blob: data: https:;
  object-src 'none';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

requestHeaders.set("x-nonce", nonce);
requestHeaders.set("Content-Security-Policy", cspHeader);
```

Server Component: `(await headers()).get("x-nonce")` → `next/script` `nonce`.

> **Next.js 16:** request interception — **`proxy.ts`**, не новая логика в `middleware.ts`.

---

## 4. XSS vs CSRF — quick matrix

| | XSS | CSRF |
|---|-----|------|
| **Суть** | Выполнение JS в браузере жертвы | Запрос от имени жертвы |
| **Основная защита** | Escaping + CSP + sanitize | SameSite + Server Actions Origin |
| **httpOnly помогает** | Частично (не от DOM theft actions) | Нет |

XSS может обойти CSRF-токены — поэтому XSS опаснее; CSP и escaping обязательны.

---

## 5. Agent checklist

**XSS:**
- [ ] Нет `dangerouslySetInnerHTML` без DOMPurify
- [ ] User URLs в `href`/`src` валидированы
- [ ] CSP nonce в `proxy.ts` для prod-critical surfaces
- [ ] Санитайз при записи в БД для rich text

**CSRF:**
- [ ] Мутирующие формы — Server Actions где возможно
- [ ] Route Handlers — проверка Origin
- [ ] `allowedOrigins` задан при proxy/CDN

**Senior:**
- [ ] Понимаешь escape vs sanitize
- [ ] Server Actions безопаснее Route Handlers для CSRF по умолчанию

---

## 6. Related

| Document | Role |
|----------|------|
| [`ai_auth_implementation_guide.md`](../auth/ai_auth_implementation_guide.md) | Auth.js layers, proxy |
| [`ai_nextjs_db_data_handle.md`](../nextjs/ai_nextjs_db_data_handle.md) | Actions vs Route Handlers |
| [`docs/general/01-security-xss-csrf.md`](../../general/01-security-xss-csrf.md) | Full theory + examples |
| Pulse reference | `docs/examples/pulse/apps/web/src/proxy.ts` |

**Reference:** Pulse (docs/examples/pulse) — security patterns; **current project Guidelines override Pulse code**.
