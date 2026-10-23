import { MUTATION_ERROR_CODES, type MutationErr } from "@sunschool/domain";

const UNIQUE_VIOLATION = "P2002";

export function mapFamilyPrismaError(error: unknown): MutationErr | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === UNIQUE_VIOLATION
  ) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.FAMILY_RELATION_LIMIT,
      message: "admin.family.relation_limit",
    };
  }
  return null;
}
