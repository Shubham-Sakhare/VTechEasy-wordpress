/** Normalize a backend toggle (1/"1"/true/"on"/"yes") to a boolean. */
export function isToggleOn(value) {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;
  return ["1", "true", "on", "yes"].includes(value.trim().toLowerCase());
}
