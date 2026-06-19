import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLibrary, validateLibrary } from "../library.js";

test("parses a valid library", () => {
  const lib = parseLibrary(
    JSON.stringify({
      name: "L",
      snippets: [{ name: "a", category: "c", source: "alert(1)" }],
    }),
  );
  assert.equal(lib.name, "L");
  assert.equal(lib.snippets.length, 1);
});

test("rejects non-object root", () => {
  assert.throws(() => validateLibrary([]), /must be a JSON object/);
});

test("rejects missing name", () => {
  assert.throws(
    () => validateLibrary({ snippets: [] }),
    /name must be a non-empty string/,
  );
});

test("rejects snippets that are not arrays", () => {
  assert.throws(
    () => validateLibrary({ name: "L", snippets: {} }),
    /snippets must be an array/,
  );
});

test("rejects snippet missing source", () => {
  assert.throws(
    () => validateLibrary({ name: "L", snippets: [{ name: "a", category: "c" }] }),
    /source must be a non-empty string/,
  );
});

test("invalid JSON yields a clear error", () => {
  assert.throws(() => parseLibrary("{not json"), /invalid JSON/);
});

test("optional description and version pass through", () => {
  const lib = validateLibrary({
    name: "L",
    version: "1.2.3",
    snippets: [{ name: "a", category: "c", source: "x", description: "d" }],
  });
  assert.equal(lib.version, "1.2.3");
  assert.equal(lib.snippets[0].description, "d");
});
