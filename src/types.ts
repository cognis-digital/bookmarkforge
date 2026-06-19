/**
 * Core data model for bookmarkforge.
 *
 * A "library" is a JSON document describing a collection of bookmarklet
 * snippets. Each snippet is a small piece of JavaScript that, once exported,
 * becomes a `javascript:` bookmarklet a browser can run from the bookmarks bar.
 */

/** A single bookmarklet snippet authored by the library owner. */
export interface Snippet {
  /** Human-readable, display name (becomes the bookmark title). */
  name: string;
  /** Grouping bucket used as a folder in the exported bookmarks HTML. */
  category: string;
  /** Raw JavaScript source. NOT pre-prefixed with `javascript:`. */
  source: string;
  /** Optional free-text description (kept for audit/manifest). */
  description?: string;
}

/** The top-level library document. */
export interface Library {
  /** Library name (used as the root folder title in exports). */
  name: string;
  /** Optional version string carried into the manifest. */
  version?: string;
  /** The snippets that make up the library. */
  snippets: Snippet[];
}

/** Severity of a lint finding. */
export type LintSeverity = "warn" | "risk";

/** A single lint finding against a snippet. */
export interface LintFinding {
  /** Index of the snippet within the library (0-based). */
  index: number;
  /** Snippet name for display. */
  snippet: string;
  /** Stable machine code for the finding. */
  code: string;
  /** Severity classification. */
  severity: LintSeverity;
  /** Human-readable explanation. */
  message: string;
}

/** Aggregated result of linting an entire library. */
export interface LintReport {
  findings: LintFinding[];
  /** Number of findings with severity "risk". */
  riskCount: number;
  /** Number of findings with severity "warn". */
  warnCount: number;
}

/** A manifest entry: a snippet identity plus its integrity hash. */
export interface ManifestEntry {
  name: string;
  category: string;
  /** sha256 hex digest of the snippet source. */
  sha256: string;
  /** Byte length of the snippet source (UTF-8). */
  bytes: number;
}

/** A full manifest for a library. */
export interface Manifest {
  library: string;
  version?: string;
  count: number;
  entries: ManifestEntry[];
}
