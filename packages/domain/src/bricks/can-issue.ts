import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";
import { computeBalance } from "./compute-balance";

export type CanIssueInput = {
  earned: number;
  issued: number;
  quantity: number;
};

const quantityIntegerError = (): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.VALIDATION,
  message: "teacher.bricks.quantity_integer",
  fields: { quantity: "teacher.bricks.quantity_integer" },
});

const quantityNonzeroError = (): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.VALIDATION,
  message: "teacher.bricks.quantity_nonzero",
  fields: { quantity: "teacher.bricks.quantity_nonzero" },
});

/** bricks_ledger_contract §6.2, §8 — issue only when `0 < quantity ≤ balance`. */
export const canIssue = (input: CanIssueInput): MutationErr | null => {
  if (!Number.isInteger(input.quantity)) {
    return quantityIntegerError();
  }
  if (input.quantity <= 0) {
    return quantityNonzeroError();
  }
  const { balance } = computeBalance(input.earned, input.issued);
  if (input.quantity > balance) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.BRICKS_INSUFFICIENT,
      message: "teacher.bricks.insufficient",
    };
  }
  return null;
};

export type CanCompensateInput = {
  issued: number;
  quantity: number;
  note: string;
};

/** bricks_ledger_contract §6.3, §8 — `quantity < 0`, note required, `|quantity| ≤ issued`. */
export const canCompensate = (input: CanCompensateInput): MutationErr | null => {
  if (!Number.isInteger(input.quantity)) {
    return quantityIntegerError();
  }
  if (input.quantity >= 0) {
    return quantityNonzeroError();
  }
  if (!input.note.trim()) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "teacher.bricks.note_required",
      fields: { note: "teacher.bricks.note_required" },
    };
  }
  const magnitude = Math.abs(input.quantity);
  if (magnitude > input.issued) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.BRICKS_COMPENSATE_EXCEEDS,
      message: "teacher.bricks.compensate_exceeds",
    };
  }
  return null;
};
