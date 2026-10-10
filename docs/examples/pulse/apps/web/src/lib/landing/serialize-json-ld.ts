/** XSS-safe JSON-LD serialization per Next.js JSON-LD guide. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
