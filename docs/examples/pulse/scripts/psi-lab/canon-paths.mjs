/** Public conversion paths for PSI suite. Keep short; no admin/cabinets. */

export const CANON_PATHS = [
  "/",
  "/how-it-was-built",
  "/features",
  "/trainers",
  "/auth/login",
  "/auth/register",
  "/auth/register/trainer",
];

export function suitePaths() {
  const paths = [...CANON_PATHS];
  const trainerProfileId = process.env.PSI_TRAINER_PROFILE_ID?.trim();
  if (trainerProfileId) {
    paths.push(`/trainers/${trainerProfileId}`);
  }
  return paths;
}
