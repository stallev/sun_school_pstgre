import { TRAINER_STATUSES, type TrainerStatus } from "../types/trainer-status";

export function isTrainerStatus(value: string): value is TrainerStatus {
  return (TRAINER_STATUSES as readonly string[]).includes(value);
}
