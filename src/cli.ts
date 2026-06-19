#!/usr/bin/env node
/**
 * bookmarkforge command-line interface.
 *
 * Subcommands:
 *   lint <library.json> [--max-bytes N] [--fail-on-risk]
 *   build <library.json> -o bookmarks.html [--add-date N]
 *   manifest <library.json> [--json]
 *   new [-o library.json]
 */
import { writeFileSync } from "node:fs";
import { loadLibrary } from "./library.js";
import { lintLibrary, DEFAULT_MAX_BYTES } from "./lint.js";
import { buildManifest } from "./hash.js";
import { buildBookmarksHtml } from "./html.js";
import type { Library } from "./types.js";

const VERSION = "1.0.0";

interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string | boolean>;
}

/**
 * Minimal argument parser. Supports `--flag`, `--flag value`, `--flag=value`,
 * and short `-o value`. Unknown flags are still collected so callers can
 * report on them.
 */
function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string | boolean>();
  const valueFlags = new Set(["--max-bytes", "--add-date", "-o", "--out"]);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--") && arg.includes("=")) {
      const eq = arg.indexOf("=");
      flags.set(arg.slice(0, eq), arg.slice(eq + 1));
    } else if (arg.startsWith("--") || arg.startsWith("-")) {
      if (valueFlags.has(arg)) {
        const next = argv[i + 1];
        if (next === undefined) {
          throw new Error(`flag ${arg} requires a value`);
        }
        flags.set(arg, next);
        i++;
      } else {
        flags.set(arg, true);
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

function flagStr(args: ParsedArgs, ...names: string[]): string | undefined {
  for (const n of names) {
    const v = args.flags.get(n);
    if (typeof v === "string") return v;
  }
  return undefined;
}

function flagBool(args: ParsedArgs, ...names: string[]): boolean {
  return names.some((n) => args.flags.get(n) === true);
}

const USAGE = `bookmarkforge ${VERSION} — auditable bookmarklet library manager

Usage:
  bookmarkforge lint <library.json> [--max-bytes N] [--fail-on-risk]
  bookmarkforge build <library.json> -o <bookmarks.html> [--add-date N]
  bookmarkforge manifest <library.json> [--json]
  bookmarkforge new [-o <library.json>]

Options:
  --max-bytes N     Size limit per snippet before a size warning (default ${DEFAULT_MAX_BYTES}).
  --fail-on-risk    Exit non-zero if any risk-severity finding is present.
  -o, --out PATH    Output file path (build/new).
  --add-date N      Override ADD_DATE epoch seconds in exported HTML.
  --json            Emit manifest as JSON.
  -h, --help        Show this help.
  -v, --version     Show version.

License: COCL 1.0   Maintainer: Cognis Digital`;

function cmdLint(args: ParsedArgs): number {
  const file = args.positionals[0];
  if (!file) {
    process.stderr.write("lint: missing <library.json>\n");
    return 2;
  }
  const lib = loadLibrary(file);
  const maxBytesStr = flagStr(args, "--max-bytes");
  const opts: { maxBytes?: number } = {};
  if (maxBytesStr !== undefined) {
    const n = Number(maxBytesStr);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error("--max-bytes must be a positive number");
    }
    opts.maxBytes = n;
  }

  const report = lintLibrary(lib, opts);
  if (report.findings.length === 0) {
    process.stdout.write(
      `lint: ${lib.snippets.length} snippet(s) clean — no findings\n`,
    );
  } else {
    for (const f of report.findings) {
      const tag = f.severity === "risk" ? "RISK" : "WARN";
      process.stdout.write(
        `[${tag}] #${f.index} "${f.snippet}" (${f.code}): ${f.message}\n`,
      );
    }
    process.stdout.write(
      `lint: ${report.riskCount} risk, ${report.warnCount} warn across ${lib.snippets.length} snippet(s)\n`,
    );
  }

  if (flagBool(args, "--fail-on-risk") && report.riskCount > 0) {
    return 1;
  }
  return 0;
}

function cmdBuild(args: ParsedArgs): number {
  const file = args.positionals[0];
  if (!file) {
    process.stderr.write("build: missing <library.json>\n");
    return 2;
  }
  const out = flagStr(args, "-o", "--out");
  if (!out) {
    process.stderr.write("build: missing output path (-o <bookmarks.html>)\n");
    return 2;
  }
  const lib = loadLibrary(file);

  const buildOpts: { addDate?: number } = {};
  const addDateStr = flagStr(args, "--add-date");
  if (addDateStr !== undefined) {
    const n = Number(addDateStr);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error("--add-date must be a non-negative integer");
    }
    buildOpts.addDate = n;
  }

  const html = buildBookmarksHtml(lib, buildOpts);
  writeFileSync(out, html, "utf8");
  process.stdout.write(
    `build: wrote ${lib.snippets.length} bookmarklet(s) to ${out}\n`,
  );
  return 0;
}

function cmdManifest(args: ParsedArgs): number {
  const file = args.positionals[0];
  if (!file) {
    process.stderr.write("manifest: missing <library.json>\n");
    return 2;
  }
  const lib = loadLibrary(file);
  const manifest = buildManifest(lib);

  if (flagBool(args, "--json")) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
  } else {
    process.stdout.write(
      `# manifest: ${manifest.library}${manifest.version ? " v" + manifest.version : ""} (${manifest.count} snippet(s))\n`,
    );
    for (const e of manifest.entries) {
      process.stdout.write(`${e.sha256}  ${e.bytes}\t${e.name}\n`);
    }
  }
  return 0;
}

/** A minimal, harmless starter library emitted by `new`. */
function starterLibrary(): Library {
  return {
    name: "My Bookmarklets",
    version: "0.1.0",
    snippets: [
      {
        name: "Word Count",
        category: "Utilities",
        source:
          "(function(){var t=(window.getSelection&&window.getSelection().toString())||'';var n=t.trim()?t.trim().split(/\\s+/).length:0;alert(n+' word(s) selected');})();",
        description: "Counts words in the current text selection.",
      },
    ],
  };
}

function cmdNew(args: ParsedArgs): number {
  const lib = starterLibrary();
  const text = JSON.stringify(lib, null, 2) + "\n";
  const out = flagStr(args, "-o", "--out");
  if (out) {
    writeFileSync(out, text, "utf8");
    process.stdout.write(`new: wrote starter library to ${out}\n`);
  } else {
    process.stdout.write(text);
  }
  return 0;
}

export function main(argv: string[]): number {
  const args = parseArgs(argv);

  if (flagBool(args, "-h", "--help") || args.positionals.length === 0) {
    process.stdout.write(USAGE + "\n");
    return 0;
  }
  if (flagBool(args, "-v", "--version")) {
    process.stdout.write(VERSION + "\n");
    return 0;
  }

  const cmd = args.positionals.shift();
  try {
    switch (cmd) {
      case "lint":
        return cmdLint(args);
      case "build":
        return cmdBuild(args);
      case "manifest":
        return cmdManifest(args);
      case "new":
        return cmdNew(args);
      default:
        process.stderr.write(`unknown command: ${cmd}\n\n${USAGE}\n`);
        return 2;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`error: ${msg}\n`);
    return 1;
  }
}

process.exit(main(process.argv.slice(2)));
