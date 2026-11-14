# Zot Vitro Connector

A fork of the [Zotero Connector](https://github.com/zotero/zotero-connectors) that saves to
**ZotFlow in Obsidian** ([ZotFlow Evo](https://github.com/pad-mac/zotflow-evo)) instead of the
Zotero desktop app. It is not made or endorsed by Zotero; "Zotero" is a trademark of the
Corporation for Digital Scholarship. Licensed like the original, under the AGPL v3 (`COPYING`).

## Status

First prototype, **Firefox only**, unsigned.

## What is changed from upstream

Kept small, so upstream changes merge in cleanly (the `upstream` remote is
`zotero/zotero-connectors`). Every change is marked `Zot Vitro` in the code.

| Where | Change |
| --- | --- |
| `src/common/zotero.js` | Talks to `127.0.0.1:23121` (ZotFlow) instead of `23119` (Zotero). |
| `src/common/zotero_config.js` | `ALWAYS_FETCH_FROM_REPOSITORY`: translators come from repo.zotero.org, as they do for the Connector without Zotero. `VITRO`: the names used in messages. |
| `src/common/itemSaver.js` | `saveItems` also sends the items as the Zotero web API takes them (`zotflow.apiItems`, converted with the Connector's own `itemToAPIJSON`). No fallback to saving to zotero.org. |
| `src/common/inject/inject.jsx` | When ZotFlow is not reachable: "Is Obsidian running?", with Try again and Cancel (no saving to zotero.org). |
| `src/browserExt/manifest.json`, `src/messages.json`, `build.sh` | Name "Zot Vitro Connector", its own add-on ID, no Zotero update URL; the name in every language. |
| `icons/` | A V instead of Zotero's Z (`scripts/vitro/make-icons.py`). |

## Building

Needs Node, `rsync`, `zip`, `jq` and `rsvg-convert`.

```
git submodule update --init --recursive
npm ci
scripts/vitro/build-firefox        # → dist/zot-vitro-connector-<version>.xpi
```

The version (default `5.0.900`) is also what the Connector tells repo.zotero.org it is, so it
stays above the Zotero Connector's own versions.

Checks:

- `node scripts/vitro/check-conversion.js build/firefox` converts sample items the way a save
  does (in a Chromium page, with the built scripts).
- `scripts/vitro/e2e/run.sh /path/to/zotflow-evo` saves from end to end: the built extension in
  Chromium (the MV3 build shares the code that changed), translators from repo.zotero.org,
  ZotFlow's real connector server with Zotero's web API faked. A test article with its PDF; one
  with only a DOI (the PDF found by Zotero's open-access search, for real); HTML snapshots; the
  popup's changes; a plain page; a PDF tab; a web page's request (refused).

HTML snapshots and finding open-access PDFs are the Connector's own, unchanged: it asks for them
when ZotFlow's ping says so (`automaticSnapshots`, `downloadAssociatedFiles`), as with Zotero.

## Trying it in Firefox

1. In ZotFlow's settings (Sync → Browser connector), turn on **Save from the browser** (desktop
   only; Obsidian must be running; needs ZotFlow's Zotero API key).
2. In Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → the `.xpi`
   (or `build/firefox/manifest.json`). It stays until Firefox restarts. Turn off the Zotero
   Connector while trying it, so only one button saves.
3. To keep it installed, the add-on has to be signed by Mozilla (unlisted, for self-distribution).
