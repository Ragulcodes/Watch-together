/**
 * Lowercase, hyphenate, and trim a string into a URL-safe slug (max 40 chars).
 * Returns "" when the input has no slug-able characters — callers supply a
 * fallback (e.g. a random suffix) in that case.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
