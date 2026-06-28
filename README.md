# bookmarkforge

An auditable manager for **bookmarklets** and small browser-automation
snippets. You keep a library of snippets in plain JSON; bookmarkforge lints
them, computes an integrity hash for each, and exports a standard,
browser-importable **Netscape bookmarks HTML** file where every snippet becomes
a `javascript:` bookmarklet.

Zero runtime dependencies. TypeScript, Node ESM.


<!-- cognis:example:start -->
## 🔎 Example output

**Sample result format** _(illustrative values — run on your own data for real findings):_

```
{
"bookmarks": [
  {
    "id": "1234567890",
    "title": "Example Bookmark 1",
    "url": "https://example.com/page1",
    "tags": ["tag1", "tag2"],
    "notes": "This is a note for bookmark 1"
  },
  {
    "id": "2345678901",
    "title": "Example Bookmark 2",
    "url": "https://example.com/page2",
    "tags": ["tag3", "tag4"],
    "notes": "This is a note for bookmark 2"
  }
]
}
```

<!-- cognis:example:end -->

## Why

Bookmarklets are tiny, powerful, and easy to lose track of. A snippet that
quietly grew an `eval()` or a remote `fetch()` is a real risk sitting one click
away on your bookmarks bar. bookmarkforge keeps the library as reviewable
source, flags risky patterns for human attention, and gives you a content hash
per snippet so you can detect drift.

## Install

```sh
npm install
npm run build
```

This produces `dist/cli.js` (the `bookmarkforge` bin) and the compiled library.

## Library format

A library is a JSON object:

```json
{
  "name": "My Bookmarklets",
  "version": "1.0.0",
  "snippets": [
    {
      "name": "Word Count",
      "category": "Text",
      "source": "(function(){ alert('hi'); })();",
      "description": "Optional human note."
    }
  ]
}
```

`source` is raw JavaScript (do **not** prefix it with `javascript:` — that is
added on export). `category` is used to group snippets into folders.

See [`examples/library.json`](examples/library.json) for a working set of
harmless utility bookmarklets.

## Commands

### `lint`

Checks each snippet for size and risky patterns.

```sh
bookmarkforge lint examples/library.json
bookmarkforge lint examples/library.json --max-bytes 1024
bookmarkforge lint examples/library.json --fail-on-risk
```

- `--max-bytes N` — size limit per snippet before a `WARN` (default `2048`).
- `--fail-on-risk` — exit with code `1` if any `RISK` finding is present
  (useful in CI / pre-commit).

Risk detectors flag for review (not block): `eval`, `new Function`,
`document.write`, `innerHTML` assignment, `<script>` element creation, remote
`fetch`/`XMLHttpRequest`/dynamic `import`, remote `.src`, and string-form
`setTimeout`/`setInterval`.

### `build`

Exports a Netscape bookmarks HTML file, grouped by category, with each snippet
URL-encoded into a `javascript:` href.

```sh
bookmarkforge build examples/library.json -o bookmarks.html
```

- `-o, --out PATH` — output file (required).
- `--add-date N` — override the `ADD_DATE` epoch-seconds value (handy for
  reproducible output).

Import the resulting `bookmarks.html` through your browser's bookmark manager
("Import bookmarks from HTML").

### `manifest`

Prints an integrity manifest: `sha256  bytes  name` per snippet.

```sh
bookmarkforge manifest examples/library.json
bookmarkforge manifest examples/library.json --json
```

Use `--json` for a machine-readable manifest (name, category, sha256, bytes)
suitable for diffing across versions to detect snippet drift.

### `new`

Emits a minimal starter library to stdout, or to a file with `-o`.

```sh
bookmarkforge new -o library.json
```

## Programmatic use

The package also exports its building blocks:

```ts
import {
  loadLibrary,
  lintLibrary,
  buildManifest,
  buildBookmarksHtml,
} from "@cognis-digital/bookmarkforge";
```

## Development

```sh
npm run build   # tsc -> dist/
npm test        # node --test over dist/test/*.test.js
```

Tests run on the compiled output (`node:test`), so always build before testing.

## How the export works

bookmarkforge implements the Netscape Bookmark File Format and the
percent-encoding itself (see `src/html.ts` and `src/encode.ts`) so the output is
fully explicit and auditable — no opaque third-party serialization. The source
of each snippet is percent-encoded byte-by-byte (UTF-8), prefixed with
`javascript:`, then HTML-attribute escaped into the `HREF`.

## License

License: COCL 1.0

Maintainer: Cognis Digital
