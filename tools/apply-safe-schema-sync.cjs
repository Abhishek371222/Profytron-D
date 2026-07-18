const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const apiDir = path.join(__dirname, '..', 'apps', 'api');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const { PrismaClient } = apiRequire('@prisma/client');
process.chdir(apiDir);

const initSql = fs.readFileSync(
  path.join(apiDir, 'prisma/migrations/20260410211446_init/migration.sql'),
  'utf8',
);
const supplementSql = fs.readFileSync(
  path.join(apiDir, 'prisma/safe-profytron-supplement.sql'),
  'utf8',
);

function transformStatement(raw) {
  const s = raw.trim().replace(/;\s*$/, '');
  if (!s || s.startsWith('--')) return null;
  if (/^DROP /i.test(s)) return null;

  if (s.startsWith('CREATE TYPE')) {
    return `DO $$ BEGIN ${s}; EXCEPTION WHEN duplicate_object THEN null; END $$`;
  }
  if (s.startsWith('CREATE TABLE')) {
    return `${s.replace(/^CREATE TABLE(?! IF NOT EXISTS)/, 'CREATE TABLE IF NOT EXISTS')};`;
  }
  if (s.startsWith('CREATE UNIQUE INDEX')) {
    return `${s.replace(/^CREATE UNIQUE INDEX(?! IF NOT EXISTS)/, 'CREATE UNIQUE INDEX IF NOT EXISTS')};`;
  }
  if (s.startsWith('CREATE INDEX')) {
    return `${s.replace(/^CREATE INDEX(?! IF NOT EXISTS)/, 'CREATE INDEX IF NOT EXISTS')};`;
  }
  if (s.startsWith('ALTER TABLE') && s.includes('ADD CONSTRAINT')) {
    return `DO $$ BEGIN ${s}; EXCEPTION WHEN duplicate_object THEN null; END $$`;
  }
  return `${s};`;
}

function splitSql(sql) {
  const statements = [];
  const lines = sql.split(/\r?\n/);
  let buffer = '';
  let inDollarBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inDollarBlock && trimmed.startsWith('--')) {
      continue;
    }

    if (!inDollarBlock && /^DO \$\$|^CREATE OR REPLACE FUNCTION/i.test(trimmed)) {
      inDollarBlock = true;
    }

    buffer += `${line}\n`;

    if (inDollarBlock) {
      if (/^\$\$;\s*$/.test(trimmed) || /\$\$ LANGUAGE plpgsql;\s*$/.test(trimmed)) {
        statements.push(buffer.trim());
        buffer = '';
        inDollarBlock = false;
      }
      continue;
    }

    if (trimmed.endsWith(';')) {
      statements.push(buffer.trim());
      buffer = '';
    }
  }

  if (buffer.trim()) {
    statements.push(buffer.trim());
  }

  return statements.filter(Boolean);
}

async function main() {
  const statements = [
    ...splitSql(initSql).map(transformStatement),
    ...splitSql(supplementSql),
  ].filter(Boolean);

  const prisma = new PrismaClient();
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      applied += 1;
    } catch (error) {
      const msg = error?.message || String(error);
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        msg.includes('42701') ||
        msg.includes('42P07')
      ) {
        skipped += 1;
        continue;
      }
      console.error('Failed statement:', statement.slice(0, 120));
      console.error(msg);
      skipped += 1;
    }
  }

  console.log(`Schema sync complete. Applied: ${applied}, skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
