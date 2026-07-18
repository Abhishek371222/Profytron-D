#!/usr/bin/env node
/**
 * Static validation/DTO inventory + optional live 400 probes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadEnv,
  ensureDirs,
  writeJson,
  walkTs,
  API_SRC,
  rel,
  request,
  apiBase,
} from './lib.mjs';

loadEnv();
ensureDirs();

const VALIDATORS = [
  'IsString',
  'IsEmail',
  'IsInt',
  'IsNumber',
  'IsBoolean',
  'IsOptional',
  'IsNotEmpty',
  'IsEnum',
  'IsUUID',
  'IsArray',
  'ValidateNested',
  'Min',
  'Max',
  'MinLength',
  'MaxLength',
  'Matches',
  'IsUrl',
  'Type',
];

const dtoFiles = walkTs(API_SRC).filter(
  (f) => f.includes(`${path.sep}dto${path.sep}`) || f.endsWith('.dto.ts'),
);

const dtos = [];
const decoratorCounts = Object.fromEntries(VALIDATORS.map((v) => [v, 0]));

for (const f of dtoFiles) {
  const text = fs.readFileSync(f, 'utf8');
  const classes = [...text.matchAll(/export\s+class\s+(\w+)/g)].map((m) => m[1]);
  for (const v of VALIDATORS) {
    const re = new RegExp(`@${v}\\b`, 'g');
    const n = (text.match(re) || []).length;
    decoratorCounts[v] += n;
  }
  const nested = (text.match(/@ValidateNested/g) || []).length;
  const transform = (text.match(/@Type\(/g) || []).length;
  dtos.push({
    file: rel(f),
    classes,
    nested,
    transform,
    bytes: Buffer.byteLength(text),
  });
}

const pipeConfig = {
  source: 'apps/api/src/app.setup.ts',
  options: {
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  },
  note: 'Global ValidationPipe applies to all body/query DTOs',
};

// Live probes: invalid body on public auth routes if API up
const probes = [];
const health = await request('GET', '/health');
if (health.status > 0) {
  const cases = [
    { method: 'POST', path: '/v1/auth/login', body: { email: 'not-an-email' }, expect: [400, 401, 422] },
    { method: 'POST', path: '/v1/auth/register', body: {}, expect: [400, 422] },
  ];
  for (const c of cases) {
    const res = await request(c.method, c.path, { body: c.body });
    probes.push({
      ...c,
      status: res.status,
      ms: res.ms,
      bytes: res.bytes,
      shape: res.json
        ? {
            success: res.json.success,
            keys: Object.keys(res.json).slice(0, 12),
            hasMessage: Boolean(res.json.message || res.json.error || res.json.errors),
          }
        : null,
    });
  }
}

writeJson('validation.json', {
  at: new Date().toISOString(),
  base: apiBase(),
  pipeConfig,
  dtoFileCount: dtoFiles.length,
  decoratorCounts,
  largestDtos: dtos.sort((a, b) => b.bytes - a.bytes).slice(0, 25),
  probes,
});

console.log(
  JSON.stringify(
    { dtoFiles: dtoFiles.length, decoratorCounts, probes: probes.length },
    null,
    2,
  ),
);
