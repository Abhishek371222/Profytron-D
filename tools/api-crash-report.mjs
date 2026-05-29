import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  supervisor: path.join(root, '.tmp_api_supervisor.log'),
  apiRun: path.join(root, '.tmp_api_run.log'),
  apiError: path.join(root, 'apps', 'api', 'logs', 'error.log'),
  apiCombined: path.join(root, 'apps', 'api', 'logs', 'combined.log'),
};

function safeRead(filePath, tailLines = 120) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  return lines.slice(-tailLines);
}

function printSection(title, lines) {
  console.log(`\n=== ${title} ===`);
  if (!lines.length) {
    console.log('(no data)');
    return;
  }
  lines.forEach((line) => console.log(line));
}

function summarize(lines) {
  const joined = lines.join('\n');
  const findings = [];

  if (/ECONNREFUSED/.test(joined)) {
    findings.push('Detected ECONNREFUSED: API or dependency endpoint was unreachable.');
  }
  if (/ENOTFOUND/.test(joined)) {
    findings.push('Detected ENOTFOUND: hostname resolution issue (e.g., redis.railway.internal unreachable locally).');
  }
  if (/EADDRINUSE/.test(joined)) {
    findings.push('Detected EADDRINUSE: preferred port already in use during startup.');
  }
  if (/exit code 3221225495|3221225495/.test(joined)) {
    findings.push('Detected Windows native crash code 3221225495: investigate native module/runtime environment.');
  }
  if (/Nest application successfully started/.test(joined)) {
    findings.push('Nest startup completed at least once.');
  }

  return findings;
}

const supervisorLines = safeRead(files.supervisor, 80);
const apiRunLines = safeRead(files.apiRun, 80);
const errorLines = safeRead(files.apiError, 80);
const combinedLines = safeRead(files.apiCombined, 80);

printSection('Supervisor Log (tail)', supervisorLines);
printSection('.tmp_api_run.log (tail)', apiRunLines);
printSection('apps/api/logs/error.log (tail)', errorLines);
printSection('apps/api/logs/combined.log (tail)', combinedLines);

const findings = summarize([
  ...supervisorLines,
  ...apiRunLines,
  ...errorLines,
  ...combinedLines,
]);

console.log('\n=== Crash Summary ===');
if (!findings.length) {
  console.log('No clear crash signatures found in the current log tails.');
} else {
  findings.forEach((f, idx) => console.log(`${idx + 1}. ${f}`));
}
