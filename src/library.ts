import { readFileSync } from "node:fs";
import type { Library, Snippet } from "./types.js";

/**
 * Validate and normalize a parsed JSON value into a {@link Library}.
 * Throws a descriptive Error on any structural problem so the CLI can
 * surface a clean message instead of a stack trace.
 */
export function validateLibrary(value: unknown): Library {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("library must be a JSON object");
  }
  const obj = value as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    throw new Error('library.name must be a non-empty string');
  }
  if (obj.version !== undefined && typeof obj.version !== "string") {
    throw new Error("library.version must be a string when present");
  }
  if (!Array.isArray(obj.snippets)) {
    throw new Error("library.snippets must be an array");
  }

  const snippets: Snippet[] = obj.snippets.map((raw, i) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new Error(`snippet[${i}] must be an object`);
    }
    const s = raw as Record<string, unknown>;
    if (typeof s.name !== "string" || s.name.trim() === "") {
      throw new Error(`snippet[${i}].name must be a non-empty string`);
    }
    if (typeof s.category !== "string" || s.category.trim() === "") {
      throw new Error(`snippet[${i}].category must be a non-empty string`);
    }
    if (typeof s.source !== "string" || s.source === "") {
      throw new Error(`snippet[${i}].source must be a non-empty string`);
    }
    if (s.description !== undefined && typeof s.description !== "string") {
      throw new Error(`snippet[${i}].description must be a string when present`);
    }
    const snippet: Snippet = {
      name: s.name,
      category: s.category,
      source: s.source,
    };
    if (typeof s.description === "string") {
      snippet.description = s.description;
    }
    return snippet;
  });

  const library: Library = { name: obj.name, snippets };
  if (typeof obj.version === "string") {
    library.version = obj.version;
  }
  return library;
}

/** Parse a JSON string into a validated {@link Library}. */
export function parseLibrary(text: string): Library {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSON: ${msg}`);
  }
  return validateLibrary(parsed);
}

/** Read a library JSON file from disk and return a validated {@link Library}. */
export function loadLibrary(path: string): Library {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`cannot read ${path}: ${msg}`);
  }
  return parseLibrary(text);
}
