#!/usr/bin/env node
/**
 * Static inventory of Nest controllers → endpoints.json + routes.json
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  API_SRC,
  ensureDirs,
  writeJson,
  walkTs,
  rel,
  loadEnv,
} from './lib.mjs';

loadEnv();
ensureDirs();

const METHOD_RE =
  /@(Get|Post|Put|Patch|Delete|Head|Options|All)\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/g;

function joinRoute(prefix, sub) {
  const a = (prefix || '').replace(/^\//, '').replace(/\/$/, '');
  const b = (sub || '').replace(/^\//, '');
  if (!a && !b) return '/';
  if (!a) return `/${b}`;
  if (!b) return `/${a}`;
  return `/${a}/${b}`.replace(/\/+/g, '/');
}

function fullHttpPath(controllerPath, methodPath, excludePrefix) {
  const joined = joinRoute(controllerPath, methodPath);
  if (excludePrefix || joined === '/health' || joined.startsWith('/health')) {
    return joined === '/' ? '/health' : joined;
  }
  if (joined.startsWith('/v1/') || joined === '/v1') return joined;
  return `/v1${joined === '/' ? '' : joined}`;
}

function extractBlockDecorators(text, index) {
  // Look backward up to 800 chars for decorators on the handler
  const start = Math.max(0, index - 900);
  const window = text.slice(start, index);
  const lines = window.split('\n').reverse();
  const decs = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('@')) {
      decs.push(t);
      continue;
    }
    if (t.startsWith('async ') || t.startsWith('public ') || /\w+\(/.test(t)) break;
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue;
    break;
  }
  return decs.reverse();
}

function parseController(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const ctrlMatch = text.match(/@Controller\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/);
  if (!ctrlMatch && !filePath.endsWith('app.controller.ts')) {
    // still try if Controller() empty
  }
  const controllerPath = ctrlMatch ? ctrlMatch[1] || ctrlMatch[2] || '' : '';
  const classMatch = text.match(/export\s+class\s+(\w+)/);
  const controller = classMatch?.[1] || path.basename(filePath, '.ts');
  const module =
    rel(filePath).match(/modules\/([^/]+)/)?.[1] ||
    (filePath.includes('app.controller') ? 'app' : 'unknown');

  const classPublic = /@Public\(\)/.test(text.slice(0, text.indexOf('export class')));
  const classRoles = [...text.matchAll(/@Roles\(\s*'([^']+)'\s*\)/g)].map((m) => m[1]);
  const classThrottle = [...text.matchAll(/@Throttle\(\s*\{([^}]+)\}\s*\)/g)].map((m) =>
    m[1].replace(/\s+/g, ' ').trim(),
  );

  // constructor injects
  const ctor = text.match(/constructor\s*\(([^)]*)\)/s);
  const injects = [];
  if (ctor) {
    for (const part of ctor[1].split(',')) {
      const m = part.match(/(?:private|public|protected|readonly)?\s*(?:readonly\s+)?(\w+)\s*:\s*(\w+)/);
      if (m) injects.push({ param: m[1], type: m[2] });
    }
  }

  const endpoints = [];
  let m;
  const re = new RegExp(METHOD_RE.source, 'g');
  while ((m = re.exec(text))) {
    const method = m[1].toUpperCase();
    const methodPath = m[2] || m[3] || '';
    const decs = extractBlockDecorators(text, m.index);
    const isPublic =
      classPublic || decs.some((d) => d.startsWith('@Public')) || /@Public\(\)/.test(decs.join('\n'));
    const roles = [
      ...classRoles,
      ...decs.flatMap((d) => {
        const rm = d.match(/@Roles\(\s*'([^']+)'/);
        return rm ? [rm[1]] : [];
      }),
    ];
    const throttle = [
      ...classThrottle,
      ...decs.filter((d) => d.startsWith('@Throttle')).map((d) => d.slice(0, 120)),
    ];
    const dtoHints = [];
    const after = text.slice(m.index, m.index + 500);
    const bodyDto = after.match(/@Body\(\)\s*(?:\w+\s*:\s*)?(\w+Dto|\w+DTO|\w+)/);
    if (bodyDto) dtoHints.push({ kind: 'body', type: bodyDto[1] });
    const queryDto = after.match(/@Query\(\)\s*(?:\w+\s*:\s*)?(\w+)/);
    if (queryDto) dtoHints.push({ kind: 'query', type: queryDto[1] });

    // AppController: '' → /v1/; 'health' excluded from prefix → /health
    let httpPath;
    if (filePath.endsWith('app.controller.ts')) {
      if (methodPath === 'health') httpPath = '/health';
      else if (!methodPath) httpPath = '/v1';
      else httpPath = fullHttpPath(controllerPath, methodPath, false);
    } else {
      httpPath = fullHttpPath(controllerPath, methodPath, false);
    }

    let auth = 'user';
    if (isPublic) auth = 'public';
    else if (roles.includes('ADMIN') || module === 'admin' || controller.startsWith('Admin'))
      auth = 'admin';

    const handlerSnippet = text.slice(m.index, m.index + 200);
    const handlerName = (handlerSnippet.match(/(?:async\s+)?(\w+)\s*\(/) || [])[1] || null;

    endpoints.push({
      method,
      path: httpPath,
      controllerPath,
      methodPath,
      module,
      controller,
      handler: handlerName,
      file: rel(filePath),
      auth,
      roles: [...new Set(roles)],
      public: isPublic,
      throttle,
      dtoHints,
      injects,
      decorators: decs.slice(0, 12),
      probeable: method === 'GET' || method === 'HEAD',
    });
  }
  return { controller, module, file: rel(filePath), injects, endpoints };
}

const files = walkTs(API_SRC).filter((f) => f.endsWith('.controller.ts'));
const controllers = [];
const endpoints = [];
for (const f of files) {
  const parsed = parseController(f);
  controllers.push({
    controller: parsed.controller,
    module: parsed.module,
    file: parsed.file,
    injects: parsed.injects,
    endpointCount: parsed.endpoints.length,
  });
  endpoints.push(...parsed.endpoints);
}

// Normalize health
for (const ep of endpoints) {
  if (ep.file.endsWith('app.controller.ts') && ep.methodPath === 'health') {
    ep.path = '/health';
    ep.auth = 'public';
    ep.public = true;
  }
}

const byMethod = {};
for (const ep of endpoints) {
  byMethod[ep.method] = (byMethod[ep.method] || 0) + 1;
}

const inventory = {
  at: new Date().toISOString(),
  globalPrefix: 'v1',
  healthExcludedFromPrefix: true,
  global: {
    guards: ['JwtAuthGuard', 'AppThrottlerGuard'],
    pipes: ['ValidationPipe(whitelist,transform,forbidNonWhitelisted)'],
    interceptors: ['SentryInterceptor', 'TransformInterceptor', 'AuditInterceptor'],
    filters: ['AllExceptionsFilter'],
  },
  counts: {
    controllers: controllers.length,
    endpoints: endpoints.length,
    byMethod,
    public: endpoints.filter((e) => e.auth === 'public').length,
    user: endpoints.filter((e) => e.auth === 'user').length,
    admin: endpoints.filter((e) => e.auth === 'admin').length,
    probeableGet: endpoints.filter((e) => e.probeable).length,
  },
  controllers,
  endpoints,
};

writeJson('endpoints.json', inventory);

const routes = {
  at: inventory.at,
  baseDefault: 'http://localhost:4000',
  routes: endpoints.map((e) => ({
    method: e.method,
    path: e.path,
    module: e.module,
    controller: e.controller,
    auth: e.auth,
    probeable: e.probeable,
    roles: e.roles,
  })),
};
fs.writeFileSync(
  path.join(ROOT, 'tools/api-audit/routes.json'),
  JSON.stringify(routes, null, 2),
);
writeJson('routes.json', routes);

console.log(
  JSON.stringify(
    {
      controllers: inventory.counts.controllers,
      endpoints: inventory.counts.endpoints,
      byMethod,
      routesFile: 'tools/api-audit/routes.json',
    },
    null,
    2,
  ),
);
