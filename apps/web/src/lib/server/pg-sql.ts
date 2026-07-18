import { Pool } from 'pg';

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
