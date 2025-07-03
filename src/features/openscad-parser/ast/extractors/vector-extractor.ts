// Vector extractor doesn't use ast types directly

/**
 * Extract a vector from a string
 * @param text The string to extract from
 * @returns The vector or null if the string is not a vector
 */
export function extractVectorFromString(text: string): number[] | null {
  console.log(
    `[extractVectorFromString] Extracting vector from string: ${text}`
  );

  // Check if the string is a vector
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      // Extract the vector values
      const vectorStr = text.substring(1, text.length - 1);
      const vectorValues = vectorStr.split(',').map(v => parseFloat(v.trim()));

      // Check if all values are numbers
      if (vectorValues.every(v => !isNaN(v))) {
        console.log(
          `[extractVectorFromString] Extracted vector: ${JSON.stringify(
            vectorValues
          )}`
        );
        return vectorValues;
      }
    } catch (_e) {
      console.log(
        `[extractVectorFromString] Failed to parse vector string: ${text}`
      );
    }
  }

  return null;
}
