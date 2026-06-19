import { test } from "node:test";
import assert from "node:assert/strict";
import { sha256, byteLength, buildManifest } from "../hash.js";
import type { Library } from "../types.js";

test("sha256 matches known vector for empty string", () => {
  assert.equal(
    sha256(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("sha256 matches known vector for 'abc'", () => {
  assert.equal(
    sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("byteLength counts UTF-8 bytes", () => {
  assert.equal(byteLength("abc"), 3);
  assert.equal(byteLength("é"), 2);
});

test("buildManifest produces one entry per snippet with hashes", () => {
  const lib: Library = {
    name: "L",
    version: "2.0",
    snippets: [
      { name: "a", category: "c", source: "abc" },
      { name: "b", category: "c", source: "xyz" },
    ],
  };
  const m = buildManifest(lib);
  assert.equal(m.count, 2);
  assert.equal(m.version, "2.0");
  assert.equal(m.entries[0].sha256, sha256("abc"));
  assert.equal(m.entries[0].bytes, 3);
});
