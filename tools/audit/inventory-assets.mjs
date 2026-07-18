import fs from 'node:fs';
import path from 'node:path';
const root = 'apps/web/public';
const files = [];
function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) walk(p);
    else {
      const st = fs.statSync(p);
      files.push({ path: p, bytes: st.size, ext: path.extname(p).toLowerCase() });
    }
  }
}
if (fs.existsSync(root)) walk(root);
files.sort((a, b) => b.bytes - a.bytes);
const byExt = {};
for (const f of files) { byExt[f.ext] = (byExt[f.ext] || 0) + f.bytes; }
const out = { at: new Date().toISOString(), totalBytes: files.reduce((a,f)=>a+f.bytes,0), count: files.length, byExt, largest: files.slice(0, 40) };
fs.mkdirSync('docs/audit/data', { recursive: true });
fs.writeFileSync('docs/audit/data/assets-inventory.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ totalMB: +(out.totalBytes/1e6).toFixed(2), count: out.count, byExt, top10: out.largest.slice(0,10) }, null, 2));
