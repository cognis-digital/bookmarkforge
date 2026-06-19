/**
 * Clean-room percent-encoding for embedding JavaScript source inside a
 * `javascript:` bookmarklet href.
 *
 * We intentionally implement this ourselves rather than leaning entirely on
 * `encodeURIComponent` for the document-level escaping, so the behaviour is
 * explicit and auditable. The strategy:
 *
 *   1. Percent-encode the JS source so that it is a safe URI component, while
 *      keeping a generous set of characters readable so the produced
 *      bookmarklet remains legible. We encode anything that could break out of
 *      an HTML attribute or confuse a URI parser.
 *   2. The resulting `javascript:<encoded>` string is then HTML-attribute
 *      escaped by the serializer (see html.ts) before landing in HREF="...".
 */

/**
 * Characters that are safe to leave unescaped inside a bookmarklet URI.
 * This is the RFC 3986 "unreserved" set plus a handful of sub-delim style
 * characters that browsers tolerate in `javascript:` URLs and that keep the
 * source readable. Everything else is percent-encoded from its UTF-8 bytes.
 */
const SAFE = new Set<number>();
(() => {
  const add = (s: string) => {
    for (const ch of s) SAFE.add(ch.codePointAt(0)!);
  };
  add("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  add("abcdefghijklmnopqrstuvwxyz");
  add("0123456789");
  // unreserved marks
  add("-_.~");
  // additional readable, URL-tolerated punctuation in javascript: bodies
  add("!*'()");
})();

const HEX = "0123456789ABCDEF";

/** Percent-encode a single byte (0-255) as `%XX` uppercase hex. */
function pctByte(b: number): string {
  return "%" + HEX[(b >> 4) & 0xf] + HEX[b & 0xf];
}

/**
 * Percent-encode arbitrary text into a URI-component-safe form using its
 * UTF-8 byte representation. Characters in {@link SAFE} pass through; all
 * others (including spaces, quotes, angle brackets, multibyte chars) are
 * encoded byte-by-byte.
 */
export function percentEncode(input: string): string {
  const bytes = Buffer.from(input, "utf8");
  let out = "";
  for (const b of bytes) {
    if (b < 128 && SAFE.has(b)) {
      out += String.fromCharCode(b);
    } else {
      out += pctByte(b);
    }
  }
  return out;
}

/**
 * Build the full `javascript:` href body for a snippet's source.
 * Returns e.g. `javascript:alert(%22hi%22)`.
 */
export function toBookmarkletHref(source: string): string {
  // Collapse a leading "javascript:" if the author already wrote one, so we
  // never double-prefix.
  const trimmed = source.replace(/^\s*javascript:/i, "");
  return "javascript:" + percentEncode(trimmed);
}
