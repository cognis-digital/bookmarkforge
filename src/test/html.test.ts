import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBookmarksHtml, escapeHtml } from "../html.js";
import type { Library } from "../types.js";

const lib: Library = {
  name: "Test Lib",
  snippets: [
    { name: "Alert", category: "Utils", source: 'alert("hi")', description: "says hi" },
    { name: "Log", category: "Utils", source: "console.log(1)" },
    { name: "Title", category: "Page", source: "alert(document.title)" },
  ],
};

test("escapeHtml escapes the five special chars", () => {
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;");
});

test("output has Netscape doctype and structure", () => {
  const html = buildBookmarksHtml(lib, { addDate: 1700000000 });
  assert.ok(html.startsWith("<!DOCTYPE NETSCAPE-Bookmark-file-1>"));
  assert.ok(html.includes("<TITLE>Bookmarks</TITLE>"));
  assert.ok(html.includes("<DL><p>"));
  assert.ok(html.trimEnd().endsWith("</DL><p>"));
});

test("snippets become javascript: hrefs, url-encoded", () => {
  const html = buildBookmarksHtml(lib, { addDate: 1700000000 });
  assert.ok(html.includes("HREF=\"javascript:alert(%22hi%22)\""));
});

test("categories become folder H3 headers", () => {
  const html = buildBookmarksHtml(lib, { addDate: 1700000000 });
  assert.ok(html.includes(">Utils</H3>"));
  assert.ok(html.includes(">Page</H3>"));
});

test("description renders as DD", () => {
  const html = buildBookmarksHtml(lib, { addDate: 1700000000 });
  assert.ok(html.includes("<DD>says hi"));
});

test("add_date is applied", () => {
  const html = buildBookmarksHtml(lib, { addDate: 1700000000 });
  assert.ok(html.includes('ADD_DATE="1700000000"'));
});

test("snippets are grouped: two under Utils, one under Page", () => {
  const html = buildBookmarksHtml(lib, { addDate: 1700000000 });
  const utilsIdx = html.indexOf(">Utils</H3>");
  const pageIdx = html.indexOf(">Page</H3>");
  assert.ok(utilsIdx >= 0 && pageIdx >= 0 && utilsIdx < pageIdx);
});
