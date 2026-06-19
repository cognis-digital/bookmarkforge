import { test } from "node:test";
import assert from "node:assert/strict";
import { percentEncode, toBookmarkletHref } from "../encode.js";

test("percentEncode leaves unreserved characters intact", () => {
  assert.equal(percentEncode("abcXYZ0123-_.~"), "abcXYZ0123-_.~");
});

test("percentEncode escapes spaces, quotes and angle brackets", () => {
  assert.equal(percentEncode(' "<>'), "%20%22%3C%3E");
});

test("percentEncode encodes multibyte UTF-8 byte-by-byte", () => {
  // U+00E9 (é) is 0xC3 0xA9 in UTF-8.
  assert.equal(percentEncode("é"), "%C3%A9");
  // U+1F600 emoji is 4 bytes.
  assert.equal(percentEncode("\u{1F600}"), "%F0%9F%98%80");
});

test("percentEncode keeps readable js punctuation", () => {
  assert.equal(percentEncode("alert!()"), "alert!()");
});

test("toBookmarkletHref prefixes javascript: scheme", () => {
  assert.equal(toBookmarkletHref('alert("hi")'), "javascript:alert(%22hi%22)");
});

test("toBookmarkletHref does not double-prefix existing scheme", () => {
  assert.equal(
    toBookmarkletHref("javascript:alert(1)"),
    "javascript:alert(1)",
  );
});

test("percentEncode is reversible via decodeURIComponent for ASCII+UTF8", () => {
  const src = 'var x = "a b & c"; doThing<>();';
  assert.equal(decodeURIComponent(percentEncode(src)), src);
});
