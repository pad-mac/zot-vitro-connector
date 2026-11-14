const http = require("http");
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kybernetik und Gesellschaft</title>
<meta name="citation_title" content="Kybernetik und Gesellschaft: Über Rückkopplung">
<meta name="citation_author" content="Wiener, Norbert">
<meta name="citation_author" content="Mead, Margaret">
<meta name="citation_publication_date" content="1950/03/01">
<meta name="citation_journal_title" content="Zeitschrift für Systeme">
<meta name="citation_volume" content="12">
<meta name="citation_firstpage" content="23">
<meta name="citation_lastpage" content="45">
<meta name="citation_pdf_url" content="http://localhost:8089/paper.pdf">
<meta name="citation_keywords" content="cybernetics; feedback">
</head><body><h1>Kybernetik und Gesellschaft</h1><p>Text.</p></body></html>`;
http.createServer((req, res) => {
  if (req.url.startsWith("/paper.pdf")) { res.writeHead(200, { "Content-Type": "application/pdf" }); return res.end(pdf); }
  if (req.url.startsWith("/plain")) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end("<!DOCTYPE html><title>Plain page</title><p>No metadata.</p>"); }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(html);
}).listen(8089, () => console.log("site on 8089"));
