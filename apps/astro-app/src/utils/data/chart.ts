function getStringHash(str: string): number {
  let hash = 0;
  // ignore overflow
  for (let i = 0; i < str.length; i++) {
    // something similar to Horner's method
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return hash;
}

const SATURATION_FACTOR = 10;
const LIGHTNESS_FACTOR = 10;

/**
 * A deterministic function that randomly translates a string to a color by hashing the input string.
 * @param label The label to translate into a color.
 * @returns A HSL color constructed from the tag.
 */
export function colorFromLabel(label: string): string {
  const hash = getStringHash(label);
  const hue = hash % 256;
  const saturation = 50 + (hash % SATURATION_FACTOR) - SATURATION_FACTOR / 2;
  const lightness = 50 + (hash % LIGHTNESS_FACTOR) - LIGHTNESS_FACTOR / 2;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
