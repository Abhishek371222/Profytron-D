import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.VITALS_PORT || 9797);
const OUT = path.resolve('docs/audit/data/vitals.jsonl');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method === 'POST') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    const line = JSON.stringify({ at: new Date().toISOString(), body: (() => { try { return JSON.parse(body); } catch { return body; } })() }) + '\n';
    fs.appendFileSync(OUT, line);
    res.writeHead(204); res.end(); return;
  }
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true })); return; }
  res.writeHead(404); res.end();
});
server.listen(PORT, () => console.log(`[vitals-collector] listening :${PORT} -> ${OUT}`));
