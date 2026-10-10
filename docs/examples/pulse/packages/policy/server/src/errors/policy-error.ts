export type PolicyDenyCode = "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND";

export class PolicyError extends Error {
  readonly code: PolicyDenyCode;

  constructor(code: PolicyDenyCode, message?: string) {
    super(message ?? code);
    this.name = "PolicyError";
    this.code = code;
  }
}

export function assertNotImplemented(): never {
  throw new PolicyError("FORBIDDEN", "NOT_IMPLEMENTED");
}
