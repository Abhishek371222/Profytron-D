import { Logger } from '@nestjs/common';

const logger = new Logger('Datadog');

function initDatadogApm(): void {
  const agentHost = process.env.DD_AGENT_HOST?.trim();
  const traceEnabled = process.env.DD_TRACE_ENABLED !== 'false';
  if (!traceEnabled || !agentHost) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracer = require('dd-trace');
    tracer.init({
      hostname: agentHost,
      port: Number(process.env.DD_TRACE_AGENT_PORT || 8126),
      service: process.env.DD_SERVICE || 'profytron-api',
      env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
      version:
        process.env.DD_VERSION || process.env.npm_package_version || '0.0.1',
      logInjection: process.env.DD_LOGS_INJECTION !== 'false',
      runtimeMetrics: process.env.DD_RUNTIME_METRICS_ENABLED !== 'false',
      profiling: process.env.DD_PROFILING_ENABLED === 'true',
      sampleRate: Number(process.env.DD_TRACE_SAMPLE_RATE || 1),
    });
    logger.log(
      `Datadog APM enabled → ${agentHost}:${process.env.DD_TRACE_AGENT_PORT || 8126}`,
    );
  } catch (err) {
    logger.warn(
      `Failed to initialise Datadog APM: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

initDatadogApm();
