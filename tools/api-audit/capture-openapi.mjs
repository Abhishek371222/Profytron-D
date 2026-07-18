#!/usr/bin/env node
/**
 * OpenAPI capture: fetch /api/docs-json when available; compare to inventory.
 */
import fs from 'node:fs';
import {
  loadEnv,
  ensureDirs,
  writeJson,
  readJson,
  request,
  apiBase,
  walkTs,
  API_SRC,
} from './lib.mjs';

loadEnv();
ensureDirs();

const inventory = readJson('endpoints.json', { endpoints: [] });
const base = apiBase();

const candidates = ['/api/docs-json', '/api/docs-json/', '/v1/api/docs-json'];
let doc = null;
let fetchedFrom = null;
for (const p of candidates) {
  const res = await request('GET', p);
  if (res.status === 200 && res.json?.paths) {
    doc = res.json;
    fetchedFrom = p;
    break;
  }
}

const openapiPaths = doc?.paths ? Object.keys(doc.paths) : [];
const openapiOps = [];
if (doc?.paths) {
  for (const [p, methods] of Object.entries(doc.paths)) {
    for (const method of Object.keys(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        openapiOps.push({ method: method.toUpperCase(), path: p });
      }
    }
  }
}

const invKeys = new Set(
  (inventory.endpoints || []).map((e) => `${e.method} ${e.path}`),
);
const oapiKeys = new Set(openapiOps.map((e) => `${e.method} ${e.path}`));

const missingInOpenapi = [...invKeys].filter((k) => !oapiKeys.has(k));
const extraInOpenapi = [...oapiKeys].filter((k) => !invKeys.has(k));

const ctrlFiles = walkTs(API_SRC).filter((f) => f.endsWith('.controller.ts'));
const apiDeco = { ApiTags: 0, ApiOperation: 0, ApiResponse: 0, ApiBearerAuth: 0, ApiBody: 0 };
for (const f of ctrlFiles) {
  const t = fs.readFileSync(f, 'utf8');
  for (const k of Object.keys(apiDeco)) {
    apiDeco[k] += (t.match(new RegExp(`@${k}\\b`, 'g')) || []).length;
  }
}

writeJson('openapi.json', {
  at: new Date().toISOString(),
  base,
  fetchedFrom,
  available: Boolean(doc),
  pathCount: openapiPaths.length,
  operationCount: openapiOps.length,
  inventoryEndpointCount: inventory.endpoints?.length || 0,
  missingInOpenapiCount: missingInOpenapi.length,
  missingInOpenapiSample: missingInOpenapi.slice(0, 40),
  extraInOpenapiSample: extraInOpenapi.slice(0, 20),
  apiDecoratorCounts: apiDeco,
  note: doc
    ? 'Swagger document fetched'
    : 'Swagger unavailable (production often disables /api/docs) — decorator scan only',
});

console.log(
  JSON.stringify(
    {
      available: Boolean(doc),
      operations: openapiOps.length,
      missingSample: missingInOpenapi.length,
    },
    null,
    2,
  ),
);
