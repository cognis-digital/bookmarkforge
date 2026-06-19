import { createHash } from "node:crypto";
import type { Library, Manifest, ManifestEntry } from "./types.js";

/** Compute the sha256 hex digest of a snippet's source (UTF-8). */
export function sha256(source: string): string {
  return createHash("sha256").update(source, "utf8").digest("hex");
}

/** Byte length of a string when encoded as UTF-8. */
export function byteLength(source: string): number {
  return Buffer.byteLength(source, "utf8");
}

/** Build a full integrity manifest for a library. */
export function buildManifest(lib: Library): Manifest {
  const entries: ManifestEntry[] = lib.snippets.map((s) => ({
    name: s.name,
    category: s.category,
    sha256: sha256(s.source),
    bytes: byteLength(s.source),
  }));
  const manifest: Manifest = {
    library: lib.name,
    count: entries.length,
    entries,
  };
  if (lib.version !== undefined) {
    manifest.version = lib.version;
  }
  return manifest;
}
