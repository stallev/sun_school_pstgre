export const DEMO_ROLE = ["client", "trainer", "admin"] as const;
export type DemoRole = (typeof DEMO_ROLE)[number];

export const DEMO_CREDENTIALS: Record<
  DemoRole,
  { email: string; password: string }
> = {
  client: { email: "client@pulse.dev", password: "client123" },
  trainer: { email: "anna@pulse.dev", password: "trainer123" },
  admin: { email: "admin@pulse.dev", password: "admin123" },
};

export function isDemoRole(value: string | null): value is DemoRole {
  return DEMO_ROLE.includes(value as DemoRole);
}
