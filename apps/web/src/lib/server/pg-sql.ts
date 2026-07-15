import { Pool } from 'pg';

// Drop-in replacement for @neondatabase/serverless's `neon(dbUrl)` tagged-
// template query function. Neon's driver speaks Neon's own HTTP/WebSocket
// proxy protocol and cannot connect to a standard Postgres server (e.g.
// Cloud SQL) — this uses the regular wire protocol via `pg` instead, with
// the same `` sql`SELECT ...` `` calling convention so call sites don't
// need to change beyond the import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SqlFunction = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<any[]>;

const pools = new Map<string, Pool>();

function getPool(dbUrl: string): Pool {
  let pool = pools.get(dbUrl);
  if (!pool) {
    pool = new Pool({ connectionString: dbUrl, max: 5 });
    pools.set(dbUrl, pool);
  }
  return pool;
}

export function sql(dbUrl: string): SqlFunction {
  const pool = getPool(dbUrl);
  return async (strings, ...values) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}${strings[i + 1]}`;
    }
    const result = await pool.query(text, values);
    return result.rows;
  };
}
