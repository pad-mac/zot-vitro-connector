const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
// Zot Vitro: converts sample translator items the way _apiItemsForZotFlow() does, in a
// browser page with the built inject scripts. Usage: node scripts/vitro/check-conversion.js build/firefox
const dir = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text()); });
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  await p.setContent("<html><body></body></html>");
  await p.addScriptTag({ content: `window.browser = { runtime: { getManifest: () => ({ version: "5.0.900" }), getURL: (x) => x, sendMessage: () => Promise.resolve(), onMessage: { addListener() {} } }, i18n: { getMessage: () => "" } }; window.chrome = window.browser;` });
  for (const f of ["zotero_config.js", "zotero.js", "translate/promise.js", "utilities/date.js", "utilities/xregexp-all.js",
    "utilities/xregexp-unicode-zotero.js", "utilities/resource/zoteroTypeSchemaData.js", "utilities/utilities.js",
    "utilities/utilities_item.js", "utilities.js", "http.js", "translate/debug.js", "utilities/schema.js", "itemSaver.js", "cachedTypes.js", "schema.js"]) {
    try { await p.addScriptTag({ content: fs.readFileSync(path.join(dir, f), "utf8") + `\n//# sourceURL=${f}` }); }
    catch (e) { console.log("load", f, e.message); }
  }
  const out = await p.evaluate(async () => {
    Zotero.Prefs = Zotero.Prefs || {}; Zotero.Prefs.getAsync = async () => true;
    try { Zotero.Schema.init(); Zotero.Connector_Types.init(); } catch (e) { return "schema init: " + e.message; }
    if (!Zotero.ItemTypes.getID("book")) return "schema not loaded";
    const saver = Object.create(Zotero.ItemSaver.prototype);
    saver._proxy = null;
    return saver._apiItemsForZotFlow([{
      id: "abc", itemType: "journalArticle", title: "Cybernetics and Society", publicationTitle: "Journal X",
      creators: [{ firstName: "Norbert", lastName: "Wiener", creatorType: "author" }, { lastName: "ACM", fieldMode: 1, creatorType: "editor" }, { lastName: "", firstName: "" }],
      date: "1950", pages: "1-20", accessDate: "CURRENT_TIMESTAMP", bogusField: "x", publisher: "MIT",
      tags: [{ tag: "cyb", type: 1 }, "plain"], notes: [{ note: "<p>n</p>" }],
      attachments: [{ url: "https://e/a.pdf", mimeType: "application/pdf" }]
    }, { id: "x2", itemType: "nonsense", title: "T" }, { id: "b3", itemType: "bookSection", title: "Ch", bookTitle: "Book", publicationTitle: "Pub" }]);
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
