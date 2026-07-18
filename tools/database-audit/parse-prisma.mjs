#!/usr/bin/env node
/**
 * Database Audit Phase 1 — static Prisma schema inventory (measure-only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SCHEMA = path.join(ROOT, 'apps/api/prisma/schema.prisma');
const OUT = path.join(ROOT, 'docs/database-audit/phase1/data');

fs.mkdirSync(OUT, { recursive: true });

const src = fs.readFileSync(SCHEMA, 'utf8');

function parseEnums(text) {
  const enums = [];
  const re = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(text))) {
    const values = m[2]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'))
      .map((l) => l.split(/\s+/)[0]);
    enums.push({ name: m[1], values });
  }
  return enums;
}

function parseModels(text) {
  const models = [];
  const re = /model\s+(\w+)\s*\{([^]*?)\n\}/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1];
    const body = m[2];
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
    const fields = [];
    const modelAttrs = [];
    for (const line of lines) {
      if (line.startsWith('//')) continue;
      if (line.startsWith('@@')) {
        modelAttrs.push(line);
        continue;
      }
      const fieldMatch = line.match(/^(\w+)\s+(\S+)(.*)$/);
      if (!fieldMatch) continue;
      const [, fname, ftype, rest] = fieldMatch;
      const optional = ftype.endsWith('?') || rest.includes('?');
      const isArray = ftype.includes('[]');
      const baseType = ftype.replace('?', '').replace('[]', '');
      const attrs = {
        id: rest.includes('@id'),
        unique: rest.includes('@unique'),
        default: (rest.match(/@default\(([^)]+)\)/) || [])[1] || null,
        updatedAt: rest.includes('@updatedAt'),
        db: (rest.match(/@db\.(\w+(?:\([^)]*\))?)/) || [])[1] || null,
        map: (rest.match(/@map\("([^"]+)"\)/) || [])[1] || null,
        relation: null,
      };
      const rel = rest.match(/@relation\(([^)]*(?:\([^)]*\)[^)]*)*)\)/);
      if (rel) {
        const r = rel[1];
        attrs.relation = {
          raw: r.slice(0, 200),
          fields: (r.match(/fields:\s*\[([^\]]+)\]/) || [])[1]
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) || [],
          references: (r.match(/references:\s*\[([^\]]+)\]/) || [])[1]
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) || [],
          onDelete: (r.match(/onDelete:\s*(\w+)/) || [])[1] || null,
          onUpdate: (r.match(/onUpdate:\s*(\w+)/) || [])[1] || null,
          name: (r.match(/"([^"]+)"/) || [])[1] || null,
        };
      }
      fields.push({
        name: fname,
        type: baseType,
        optional: optional || ftype.endsWith('?'),
        isArray,
        ...attrs,
      });
    }

    const indexes = [];
    const uniques = [];
    let idFields = [];
    for (const a of modelAttrs) {
      if (a.startsWith('@@index')) {
        const cols = (a.match(/\[([^\]]+)\]/) || [])[1] || '';
        indexes.push({
          columns: cols.split(',').map((s) => s.trim().replace(/"/g, '')),
          raw: a,
        });
      } else if (a.startsWith('@@unique')) {
        const cols = (a.match(/\[([^\]]+)\]/) || [])[1] || '';
        uniques.push({
          columns: cols.split(',').map((s) => s.trim().replace(/"/g, '')),
          raw: a,
        });
      } else if (a.startsWith('@@id')) {
        const cols = (a.match(/\[([^\]]+)\]/) || [])[1] || '';
        idFields = cols.split(',').map((s) => s.trim());
      }
    }
    if (!idFields.length) {
      idFields = fields.filter((f) => f.id).map((f) => f.name);
    }

    models.push({
      name,
      fields,
      indexes,
      uniques,
      idFields,
      modelAttrs,
      tableMap: (modelAttrs.join(' ').match(/@@map\("([^"]+)"\)/) || [])[1] || name,
    });
  }
  return models;
}

const enums = parseEnums(src);
const models = parseModels(src);

// Relations graph
const relations = [];
for (const model of models) {
  for (const f of model.fields) {
    if (!f.relation) continue;
    const target = f.type;
    const cardinality = f.isArray
      ? 'one-to-many'
      : f.relation.fields?.length
        ? 'many-to-one'
        : 'one-to-one-or-back';
    relations.push({
      from: model.name,
      field: f.name,
      to: target,
      cardinality,
      fields: f.relation.fields,
      references: f.relation.references,
      onDelete: f.relation.onDelete,
      onUpdate: f.relation.onUpdate,
      name: f.relation.name,
    });
  }
}

// FK-like scalar fields (userId, etc.) without relation attribute still tracked via @relation fields
const jsonFields = [];
const largeTextHints = [];
for (const model of models) {
  for (const f of model.fields) {
    if (f.type === 'Json' || f.db?.startsWith('Json')) {
      jsonFields.push({ model: model.name, field: f.name });
    }
    if (f.type === 'String' && (f.db === 'Text' || f.name.toLowerCase().includes('payload') || f.name.toLowerCase().includes('content'))) {
      largeTextHints.push({ model: model.name, field: f.name, db: f.db });
    }
  }
}

const inventory = {
  at: new Date().toISOString(),
  source: 'apps/api/prisma/schema.prisma',
  counts: {
    models: models.length,
    enums: enums.length,
    relations: relations.length,
    indexes: models.reduce((a, m) => a + m.indexes.length, 0),
    uniques: models.reduce((a, m) => a + m.uniques.length + m.fields.filter((f) => f.unique).length, 0),
    jsonFields: jsonFields.length,
  },
  enums,
  models: models.map((m) => ({
    name: m.name,
    tableMap: m.tableMap,
    idFields: m.idFields,
    fieldCount: m.fields.length,
    fields: m.fields.map((f) => ({
      name: f.name,
      type: f.type,
      optional: f.optional,
      isArray: f.isArray,
      id: f.id,
      unique: f.unique,
      default: f.default,
      relationTo: f.relation ? f.type : null,
    })),
    indexes: m.indexes,
    uniques: m.uniques,
  })),
  relations,
  jsonFields,
  largeTextHints,
};

fs.writeFileSync(path.join(OUT, 'schema-inventory.json'), JSON.stringify(inventory, null, 2));

// Migration list
const migDir = path.join(ROOT, 'apps/api/prisma/migrations');
const migrations = fs
  .readdirSync(migDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
fs.writeFileSync(
  path.join(OUT, 'migrations.json'),
  JSON.stringify({ count: migrations.length, migrations }, null, 2),
);

console.log(
  JSON.stringify(
    {
      models: inventory.counts.models,
      enums: inventory.counts.enums,
      relations: inventory.counts.relations,
      indexes: inventory.counts.indexes,
      migrations: migrations.length,
      out: path.relative(ROOT, OUT),
    },
    null,
    2,
  ),
);
