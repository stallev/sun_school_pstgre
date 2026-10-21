/** Fails when a message slice contains non-JSON-safe values (e.g. functions). */
export const assertSerializableMessages = (value: unknown, path = "messages"): void => {
  if (typeof value === "function") {
    throw new Error(`Non-serializable function at ${path}`);
  }
  if (value === null || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSerializableMessages(entry, `${path}[${index}]`));
    return;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    assertSerializableMessages(entry, `${path}.${key}`);
  }
};
