const { chromium } = require("playwright");
const ext = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const ctx = await chromium.launchPersistentContext(require("path").join(require("os").tmpdir(), "zot-vitro-e2e-profile"), {
    headless: false,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 30000 });
  console.log("service worker:", sw.url());
  sw.on("console", (m) => console.log("sw:", m.text().slice(0, 300)));
  const page = await ctx.newPage();
  page.on("console", (m) => { const t = m.text(); if (/error|Zot|fail/i.test(t)) console.log("page:", t.slice(0, 300)); });
  // Let the extension fetch translators from repo.zotero.org.
  for (let i = 0; i < 60; i++) {
    const count = await sw.evaluate(async () => (await Zotero.Translators.getAllForType?.("web"))?.length ?? -1).catch((e) => "err " + e.message);
    if (typeof count === "number" && count > 100) { console.log("translators:", count); break; }
    await sleep(1000);
  }
  await page.goto("http://localhost:8089/article.html");
  let info;
  for (let i = 0; i < 30; i++) {
    info = await sw.evaluate(async () => {
      const [tab] = await browser.tabs.query({ url: "http://localhost:8089/article.html" });
      const ti = Zotero.Connector_Browser.getTabInfo(tab.id);
      return { online: Zotero.Connector.isOnline, prefs: Zotero.Connector.prefs, translators: (ti.translators || []).map((t) => t.label) };
    });
    if (info.translators.length) break;
    await sleep(1000);
  }
  console.log("tab:", JSON.stringify(info));
  await sw.evaluate(async () => {
    const [tab] = await browser.tabs.query({ url: "http://localhost:8089/article.html" });
    Zotero.Connector_Browser.saveWithTranslator(tab, 0, { fallbackOnFailure: true });
  });
  await sleep(2500);
  await page.screenshot({ path: require("path").join(__dirname, "popup.png") });
  await sleep(5500);
  // The popup: another collection, tags and a note (as the progress window sends them).
  await sw.evaluate(async () => {
    const [tab] = await browser.tabs.query({ url: "http://localhost:8089/article.html" });
    await Zotero.Messaging.sendMessage("updateSession", { target: "C1:SUB33333", tags: "macy, to read", note: "Read <b>this</b>" }, tab, null);
  });
  await sleep(3000);
  await sw.evaluate(async () => {
    const [tab] = await browser.tabs.query({ url: "http://localhost:8089/article.html" });
    await Zotero.Messaging.sendMessage("updateSession", { target: "L2", tags: "macy, to read", note: "Read <b>this</b>" }, tab, null);
  });
  await sleep(4000);
  // An article with only a DOI: the PDF from Zotero's open-access search (in ZotFlow).
  const doiPage = await ctx.newPage();
  await doiPage.goto("http://localhost:8089/doi-article");
  for (let i = 0; i < 20; i++) {
    const n = await sw.evaluate(async () => {
      const [tab] = await browser.tabs.query({ url: "http://localhost:8089/doi-article" });
      return (Zotero.Connector_Browser.getTabInfo(tab.id).translators || []).length;
    });
    if (n) break;
    await sleep(500);
  }
  await sw.evaluate(async () => {
    const [tab] = await browser.tabs.query({ url: "http://localhost:8089/doi-article" });
    Zotero.Connector_Browser.saveWithTranslator(tab, 0, { fallbackOnFailure: true });
  });
  await sleep(13000);
  // A page no translator reads: a web page item.
  const plain = await ctx.newPage();
  await plain.goto("http://localhost:8089/plain");
  await sleep(2500);
  await sw.evaluate(async () => {
    const [tab] = await browser.tabs.query({ url: "http://localhost:8089/plain" });
    await Zotero.Connector_Browser.saveAsWebpage(tab, 0, { snapshot: true });
  });
  await sleep(5000);
  // A PDF shown in the browser: a file on its own.
  const pdfPage = await ctx.newPage();
  await pdfPage.goto("http://localhost:8089/paper.pdf").catch(() => {});
  await sleep(3000);
  const pdfInfo = await sw.evaluate(async () => {
    const [tab] = await browser.tabs.query({ url: "http://localhost:8089/paper.pdf" });
    const ti = Zotero.Connector_Browser.getTabInfo(tab.id);
    await Zotero.Connector_Browser.saveAsWebpage(tab, ti.frameId, { snapshot: true });
    return { isPDF: ti.isPDF, frameId: ti.frameId };
  }).catch((e) => "err " + e.message);
  console.log("pdf tab:", JSON.stringify(pdfInfo));
  await sleep(5000);
  // A web page out of the browser: a page script cannot talk to ZotFlow.
  const fromPage = await page.evaluate(async () => {
    const out = {};
    try { const r = await fetch("http://127.0.0.1:23121/connector/getSelectedCollection", { method: "POST", body: "{}" }); out.simple = r.status; } catch (e) { out.simple = "blocked: " + e.message; }
    try { const r = await fetch("http://127.0.0.1:23121/connector/saveItems", { method: "POST", headers: { "Content-Type": "application/json", "X-Zotero-Connector-API-Version": "3" }, body: "{}" }); out.withHeader = r.status; } catch (e) { out.withHeader = "blocked: " + e.message; }
    return out;
  });
  console.log("from a web page:", JSON.stringify(fromPage));
  await ctx.close();
})().catch((e) => { console.error("RUN ERROR", e); process.exit(1); });
