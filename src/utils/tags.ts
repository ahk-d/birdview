/** Parse a free-text string into a normalized list of unique #tags (without the leading #). */
export function parseTags(input: string): string[] {
  const matches = input.match(/#[\w-]+/g) ?? [];
  return unique(matches.map((t) => t.slice(1).toLowerCase()));
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function splitHashtags(input: string): string[] {
  return unique(
    input
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`)),
  );
}

export function formatTag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`;
}
