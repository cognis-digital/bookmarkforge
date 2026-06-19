import type { Library, LintFinding, LintReport, Snippet } from "./types.js";
import { byteLength } from "./hash.js";

/**
 * Default maximum size (in UTF-8 bytes) for a single bookmarklet source.
 * Browsers historically capped bookmark URLs around a couple of KB; we use a
 * conservative practical ceiling and warn beyond it.
 */
export const DEFAULT_MAX_BYTES = 2048;

export interface LintOptions {
  /** Max snippet source size in bytes before a size warning fires. */
  maxBytes?: number;
}

/**
 * Risky-pattern detectors. Each describes a JavaScript construct that warrants
 * a human review before the snippet is trusted in a bookmarklet. These are
 * deliberately conservative heuristics (string/regex matches), not a full
 * parser — the goal is to flag for audit, not to block.
 */
interface RiskRule {
  code: string;
  test: RegExp;
  message: string;
}

const RISK_RULES: RiskRule[] = [
  {
    code: "eval",
    test: /\beval\s*\(/,
    message: "uses eval() — executes arbitrary strings as code",
  },
  {
    code: "function-constructor",
    test: /\bnew\s+Function\s*\(/,
    message: "uses new Function() — dynamic code construction",
  },
  {
    code: "document-write",
    test: /\bdocument\s*\.\s*write(?:ln)?\s*\(/,
    message: "uses document.write() — can overwrite the page document",
  },
  {
    code: "inner-html",
    test: /\.\s*innerHTML\s*=/,
    message: "assigns innerHTML — potential HTML/script injection sink",
  },
  {
    code: "remote-script-injection",
    test: /createElement\s*\(\s*['"]script['"]\s*\)/i,
    message: "creates a <script> element — may inject a remote script",
  },
  {
    code: "remote-fetch",
    test: /\b(?:fetch|XMLHttpRequest|importScripts)\b|\bimport\s*\(/,
    message: "performs a network request / dynamic import — exfiltration risk",
  },
  {
    code: "set-src-url",
    test: /\.\s*src\s*=\s*['"]https?:/i,
    message: "sets a remote .src — loads external resource",
  },
  {
    code: "settimeout-string",
    test: /\bset(?:Timeout|Interval)\s*\(\s*['"]/,
    message: "passes a string to setTimeout/setInterval — implicit eval",
  },
];

/** Lint a single snippet, returning all findings for it. */
export function lintSnippet(
  snippet: Snippet,
  index: number,
  opts: LintOptions = {},
): LintFinding[] {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const findings: LintFinding[] = [];

  const size = byteLength(snippet.source);
  if (size > maxBytes) {
    findings.push({
      index,
      snippet: snippet.name,
      code: "size",
      severity: "warn",
      message: `source is ${size} bytes, exceeds limit of ${maxBytes}`,
    });
  }

  if (/^\s*$/.test(snippet.source)) {
    findings.push({
      index,
      snippet: snippet.name,
      code: "empty",
      severity: "warn",
      message: "source is empty or whitespace-only",
    });
  }

  for (const rule of RISK_RULES) {
    if (rule.test.test(snippet.source)) {
      findings.push({
        index,
        snippet: snippet.name,
        code: rule.code,
        severity: "risk",
        message: rule.message,
      });
    }
  }

  return findings;
}

/** Lint an entire library and aggregate the findings. */
export function lintLibrary(lib: Library, opts: LintOptions = {}): LintReport {
  const findings: LintFinding[] = [];
  lib.snippets.forEach((s, i) => {
    findings.push(...lintSnippet(s, i, opts));
  });
  const riskCount = findings.filter((f) => f.severity === "risk").length;
  const warnCount = findings.filter((f) => f.severity === "warn").length;
  return { findings, riskCount, warnCount };
}
