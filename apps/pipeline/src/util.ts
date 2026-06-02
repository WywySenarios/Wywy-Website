/** Convert names with spaces/dots/dashes to snake_case (e.g. "Wywy Website" → "wywy_website"). */
export function toSnakeCase(str: string): string {
  return str.replace(/[\s.-]+/g, "_").toLowerCase();
}

/** Convert camelCase to snake_case (e.g. "altitudeAccuracy" → "altitude_accuracy"). */
export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
