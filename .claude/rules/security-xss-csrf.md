---
description: XSS, CSRF, CSP — defense in depth; DOMPurify, proxy.ts nonce, Origin checks
paths:
  - "apps/web/src/proxy.ts"
  - "apps/web/src/middleware.ts"
  - "apps/web/src/app/api/**"
  - "apps/web/src/actions/**"
  - "apps/web/src/data/**"
  - "apps/web/next.config.ts"
---
# Security — XSS, CSRF, CSP

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)  
**Guide:** [`docs/guidelines/security/ai_security_xss_csrf_guidelines.md`](docs/guidelines/security/ai_security_xss_csrf_guidelines.md)  
**Deep dive:** [`docs/general/01-security-xss-csrf.md`](docs/general/01-security-xss-csrf.md)  
**Auth layers:** **auth-security** · [ADR-002](docs/prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)

## XSS (MUST)

- React JSX escapes strings — не использовать `dangerouslySetInnerHTML` без **`isomorphic-dompurify`**
- Rich text: sanitize **при записи** в Server Action + при render (defense in depth)
- User-controlled `href`/`src`: блокировать `javascript:` scheme
- **CSP nonce** per-request в **`proxy.ts`** → `x-nonce` → `next/script` / inline styles

## CSRF (MUST)

- Cookies: `sameSite: 'lax'` minimum (Auth.js handles session cookies)
- **Server Actions** для форм — встроенная Origin-проверка Next.js
- **Route Handlers** (POST/PUT/PATCH/DELETE): validate `Origin` vs allowed app URL
- CSRF tokens — только legacy (subdomains, WebView)

## proxy.ts (Next.js 16)

- CSP + auth gate — **`proxy.ts`**, не новая логика в `middleware.ts`
- `experimental.serverActions.allowedOrigins` при reverse-proxy/CDN

## Agent checklist

- [ ] No raw user HTML in DB or DOM without DOMPurify
- [ ] Mutating Route Handlers check Origin
- [ ] CSP configured for production-critical routes
- [ ] Every mutation still calls `auth()` — CSRF ≠ authorization

Reference: Pulse (`docs/examples/pulse`) proxy/CSP patterns — **Guidelines override Pulse code**.
