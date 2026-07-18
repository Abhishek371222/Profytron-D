import { Logger } from '@nestjs/common';

const logger = new Logger('Tracing');

function initTracing(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (!endpoint) return;

  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const {
      getNodeAutoInstrumentations,
    } = require('@opentelemetry/auto-instrumentations-node');
    const {
      OTLPTraceExporter,
    } = require('@opentelemetry/exporter-trace-otlp-http');
    const { resourceFromAttributes } = require('@opentelemetry/resources');
    /* eslint-enable @typescript-eslint/no-require-imports */

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        'service.name': process.env.OTEL_SERVICE_NAME || 'profytron-api',
        'service.version': process.env.npm_package_version || '0.0.1',
        'deployment.environment': process.env.NODE_ENV || 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
    logger.log(`OpenTelemetry tracing enabled → ${endpoint}`);

    const shutdown = () => {
      sdk
        .shutdown()
        .catch((err: unknown) =>
          logger.warn(
            `OpenTelemetry shutdown error: ${
              err instanceof Error ? err.message : String(err)
            }`,
          ),
        );
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  } catch (err) {
    logger.warn(
      `Failed to initialise OpenTelemetry: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

initTracing();
