/**
 * Attempts to coerce a value into a number. Throws an error on failure.
 * @param value The value to coerce.
 * @param errorPrefix The prefix of the error message.
 * @returns The coerced number.
 */
export function coerceToNumber(
  value: unknown,
  errorPrefix: string = "",
): number {
  const output = Number(value);
  if (isNaN(output))
    throw new TypeError(
      `${errorPrefix}Failed to coerce "${value}" to a number.`,
    );
  return output;
}
