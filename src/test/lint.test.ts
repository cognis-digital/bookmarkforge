import { test } from "node:test";
import assert from "node:assert/strict";
import { lintLibrary, lintSnippet } from "../lint.js";
import type { Library, Snippet } from "../types.js";

function snip(source: string, name = "s"): Snippet {
  return { name, category: "c", source };
}

test("clean snippet produces no findings", () => {
  const findings = lintSnippet(snip("alert(1);"), 0);
  assert.equal(findings.length, 0);
});

test("eval is flagged as risk", () => {
  const findings = lintSnippet(snip("eval('1+1');"), 0);
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes("eval"));
  assert.equal(findings.find((f) => f.code === "eval")?.severity, "risk");
});

test("document.write is flagged", () => {
  const findings = lintSnippet(snip("document.write('x');"), 0);
  assert.ok(findings.some((f) => f.code === "document-write"));
});

test("remote script injection is flagged", () => {
  const findings = lintSnippet(
    snip("var s=document.createElement('script');s.src='https://x.test/a.js';"),
    0,
  );
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes("remote-script-injection"));
  assert.ok(codes.includes("set-src-url"));
});

test("fetch is flagged as remote-fetch", () => {
  const findings = lintSnippet(snip("fetch('https://x.test');"), 0);
  assert.ok(findings.some((f) => f.code === "remote-fetch"));
});

test("string setTimeout is flagged", () => {
  const findings = lintSnippet(snip("setTimeout('doIt()', 10);"), 0);
  assert.ok(findings.some((f) => f.code === "settimeout-string"));
});

test("oversize snippet produces a size warning", () => {
  const big = "x".repeat(100);
  const findings = lintSnippet(snip(big), 0, { maxBytes: 10 });
  const size = findings.find((f) => f.code === "size");
  assert.ok(size);
  assert.equal(size?.severity, "warn");
});

test("lintLibrary aggregates risk and warn counts", () => {
  const lib: Library = {
    name: "L",
    snippets: [
      snip("alert(1);", "ok"),
      snip("eval('x');", "bad"),
      snip("y".repeat(50), "big"),
    ],
  };
  const report = lintLibrary(lib, { maxBytes: 10 });
  assert.equal(report.riskCount, 1);
  assert.ok(report.warnCount >= 1);
});
