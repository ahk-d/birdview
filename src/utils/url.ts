// Helpers for turning free-typed text into a real, clickable link.

// e.g. "github.com", "sub.domain.co/path" — a bare domain without a scheme.
const DOMAINISH = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i;

export interface ParsedLink {
  url: string;
  label: string;
}

/** True when the text is (or looks like) a URL we can make clickable. */
export function looksLikeUrl(input: string): boolean {
  const s = input.trim();
  return /^https?:\/\//i.test(s) || DOMAINISH.test(s);
}

/**
 * Parse user input into a link. Accepts a bare URL ("github.com", "https://x.com/y") or an explicit
 * "Label | https://…" form. Adds https:// to schemeless domains. Returns null if it isn't a link.
 */
export function parseLinkInput(input: string): ParsedLink | null {
  const raw = input.trim();
  if (!raw) return null;

  let labelPart = '';
  let urlPart = raw;
  const pipe = raw.indexOf(' | ');
  if (pipe !== -1) {
    labelPart = raw.slice(0, pipe).trim();
    urlPart = raw.slice(pipe + 3).trim();
  }

  let url = urlPart;
  if (!/^https?:\/\//i.test(url)) {
    if (DOMAINISH.test(url)) url = `https://${url}`;
    else return null;
  }

  try {
    const u = new URL(url);
    const label = labelPart || u.hostname.replace(/^www\./, '');
    return { url: u.toString(), label };
  } catch {
    return null;
  }
}
