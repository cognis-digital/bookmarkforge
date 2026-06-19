/**
 * bookmarkforge public library API.
 *
 * Re-exports the building blocks so the package can be consumed
 * programmatically as well as via the CLI.
 */
export * from "./types.js";
export { loadLibrary, parseLibrary, validateLibrary } from "./library.js";
export { percentEncode, toBookmarkletHref } from "./encode.js";
export { sha256, byteLength, buildManifest } from "./hash.js";
export {
  lintSnippet,
  lintLibrary,
  DEFAULT_MAX_BYTES,
  type LintOptions,
} from "./lint.js";
export { buildBookmarksHtml, escapeHtml, type BuildOptions } from "./html.js";
