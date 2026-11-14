// ZotFlow's connector server with a fake web API that logs what it would write.
import * as http from "http";
import { createConnectorServer } from "connector/http";
import { ConnectorHandler } from "connector/handler";
import { ConnectorSessions } from "connector/sessions";
import { findOpenAccessFile } from "connector/find-file";

const log = (event: string, data: unknown) => console.log(JSON.stringify({ event, data }));
let n = 0;
const key = () => `K${String(++n).padStart(7, "0")}`;
let target: { libraryID: number; collectionKey: string | null } = { libraryID: 1, collectionKey: "CYB22222" };
const api = {
  async writeItems(libraryID: number, items: any[]) {
    log("writeItems", { libraryID, items });
    return items.map((it) => ({ key: it.key ?? key(), version: 5 }));
  },
  async patchItem(libraryID: number, k: string, patch: any, version?: number) { log("patchItem", { libraryID, key: k, patch, version }); },
  async deleteItems(libraryID: number, keys: string[]) { log("deleteItems", { libraryID, keys }); },
  async attachFile(t: any, file: any, parts: any, options: any) {
    const head = new TextDecoder().decode(file.bytes.slice(0, 8));
    log("attachFile", { target: t, contentType: file.contentType, extension: file.extension, size: file.bytes.length, head, parts, options });
    return key();
  },
  // The real search (Zotero's open-access service, then the file), over Node's fetch.
  findFile: (doi: string) =>
    findOpenAccessFile(doi, async (url, init) => {
      log("fetch", `${init?.method ?? "GET"} ${url}`);
      const res = await fetch(url, { method: init?.method, headers: init?.headers, body: init?.body });
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => (headers[k] = v));
      return { status: res.status, headers, bytes: new Uint8Array(await res.arrayBuffer()) };
    }),
  async standaloneFile(t: any, file: any) {
    log("standaloneFile", { target: t, contentType: file.contentType, title: file.title, size: file.bytes.length });
    return key();
  },
  filesEditable: (id: number) => id !== 3,
  syncSoon: (id: number) => log("syncSoon", id),
  defaultTarget: () => target,
  rememberTarget: (t: any) => { target = t; log("rememberTarget", t); },
};
const sessions = new ConnectorSessions(api as any);
const handler = new ConnectorHandler(sessions, {
  libraries: async () => [
    { libraryID: 1, name: "My Library", collections: [
      { libraryID: 1, key: "CYB22222", name: "Cybernetics", children: [{ libraryID: 1, key: "SUB33333", name: "Macy", children: [] }] },
      { libraryID: 1, key: "PIN44444", name: "Reading now", children: [] }] },
    { libraryID: 2, name: "Group", collections: [] },
    { libraryID: 9, name: "Read-only group", collections: [] },
  ],
  writable: (id) => id !== 9,
  filesEditable: (id) => id !== 3,
  pinned: () => ["1:PIN44444"],
  lastTarget: () => null,
  defaultTarget: () => target,
  listed: () => {},
  holdSync: () => log("holdSync", null),
  prefs: () => ({ files: true, snapshots: true }),
  failed: (m) => log("failed", m),
});
const server = createConnectorServer(http, handler, (e) => log("serverError", String(e)));
const origHandle = handler.handle.bind(handler);
handler.handle = async (req) => {
  const out = await origHandle(req);
  log("request", { method: req.method, path: req.path, origin: req.headers["origin"] ?? null, status: out.status });
  return out;
};
server.listen(23121, "127.0.0.1", () => log("listening", 23121));
