import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const logFile = path.join(repoRoot, '.tmp_api_supervisor.log');
const maxRestarts = Number(process.env.API_SUPERVISOR_MAX_RESTARTS || 20);
let restartCount = 0;
let shuttingDown = false;
let child = null;

function appendLog(line) {
  const stamped = `[${new Date().toISOString()}] ${line}\n`;
  fs.appendFileSync(logFile, stamped, 'utf8');
  process.stdout.write(stamped);
}

function startApi() {
  const command = process.platform === 'win32'
    ? 'pnpm --filter api start:dev:trace'
    : 'pnpm --filter api start:dev:trace';
  appendLog(`Starting API process (restart #${restartCount})`);

  child = spawn(command, {
    cwd: repoRoot,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
    fs.appendFileSync(logFile, data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    fs.appendFileSync(logFile, data);
  });

  child.on('exit', (code, signal) => {
    appendLog(`API process exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`);

    if (shuttingDown) {
      return;
    }

    if (code === 0) {
      appendLog('API exited cleanly. Supervisor stopping.');
      process.exit(0);
    }

    restartCount += 1;
    if (restartCount > maxRestarts) {
      appendLog(`Max restarts reached (${maxRestarts}). Supervisor exiting with failure.`);
      process.exit(code ?? 1);
    }

    const delayMs = Math.min(15000, 1000 * restartCount);
    appendLog(`Restarting API in ${delayMs}ms...`);
    setTimeout(startApi, delayMs);
  });
}

function shutdown(signal) {
  shuttingDown = true;
  appendLog(`Received ${signal}. Shutting down supervisor...`);
  if (child && !child.killed) {
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

appendLog('API supervisor booting...');
appendLog(`Crash log file: ${logFile}`);
appendLog(`Max restarts: ${maxRestarts}`);
startApi();
