import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const lockPath = join(process.cwd(), '.next', 'build.lock');

if (existsSync(lockPath)) {
  try {
    rmSync(lockPath, { force: true });
    console.log(`[prebuild] Removed stale Next build lock: ${lockPath}`);
  } catch (error) {
    console.warn(`[prebuild] Could not remove Next build lock: ${lockPath}`);
    console.warn(error instanceof Error ? error.message : String(error));
  }
}
