import type { Library, Snippet } from "./types.js";
import { toBookmarkletHref } from "./encode.js";

/**
 * HTML escaping for text content and attribute values. Clean-room: escapes the
 * five characters that can break out of text/attribute context.
 */
export function escapeHtml(input: string): string {
  let out = "";
  for (const ch of input) {
    switch (ch) {
      case "&":
        out += "&amp;";
        break;
      case "<":
        out += "&lt;";
        break;
      case ">":
        out += "&gt;";
        break;
      case '"':
        out += "&quot;";
        break;
      case "'":
        out += "&#39;";
        break;
      default:
        out += ch;
    }
  }
  return out;
}

/** Group snippets by category, preserving first-seen category order. */
function groupByCategory(snippets: Snippet[]): Map<string, Snippet[]> {
  const groups = new Map<string, Snippet[]>();
  for (const s of snippets) {
    const list = groups.get(s.category);
    if (list) {
      list.push(s);
    } else {
      groups.set(s.category, [s]);
    }
  }
  return groups;
}

export interface BuildOptions {
  /** Override the timestamp written into ADD_DATE attributes (epoch seconds). */
  addDate?: number;
}

/**
 * Serialize a library into a Netscape Bookmark File Format document.
 *
 * The Netscape format is the de-facto standard that Chrome, Firefox, Edge and
 * Safari all import: a DOCTYPE comment header followed by nested `<DL>` lists
 * where each folder is an `<H3>` and each bookmark is an `<A HREF="...">`.
 * We implement the serialization by hand so the output is fully under our
 * control and auditable.
 */
export function buildBookmarksHtml(lib: Library, opts: BuildOptions = {}): string {
  const addDate = opts.addDate ?? Math.floor(Date.now() / 1000);
  const groups = groupByCategory(lib.snippets);

  const lines: string[] = [];
  lines.push("<!DOCTYPE NETSCAPE-Bookmark-file-1>");
  lines.push(
    "<!-- This is an automatically generated file. It will be read and overwritten.",
  );
  lines.push("     DO NOT EDIT! -->");
  lines.push(
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
  );
  lines.push("<TITLE>Bookmarks</TITLE>");
  lines.push(`<H1>${escapeHtml(lib.name)}</H1>`);
  lines.push("<DL><p>");

  // Root folder named after the library, holding one sub-folder per category.
  lines.push(
    `    <DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${escapeHtml(
      lib.name,
    )}</H3>`,
  );
  lines.push("    <DL><p>");

  for (const [category, snippets] of groups) {
    lines.push(
      `        <DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${escapeHtml(
        category,
      )}</H3>`,
    );
    lines.push("        <DL><p>");
    for (const s of snippets) {
      const href = escapeHtml(toBookmarkletHref(s.source));
      const title = escapeHtml(s.name);
      const attrs = `HREF="${href}" ADD_DATE="${addDate}"`;
      lines.push(`            <DT><A ${attrs}>${title}</A>`);
      if (s.description && s.description.trim() !== "") {
        lines.push(`            <DD>${escapeHtml(s.description)}`);
      }
    }
    lines.push("        </DL><p>");
  }

  lines.push("    </DL><p>");
  lines.push("</DL><p>");
  return lines.join("\n") + "\n";
}
