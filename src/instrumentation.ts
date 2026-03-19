import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';

const tracesExporter = process.env.OTEL_TRACES_EXPORTER;
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (tracesExporter !== 'none' && otlpEndpoint) {
  const resource = defaultResource().merge(
    resourceFromAttributes({
      'service.name': process.env.OTEL_SERVICE_NAME || 'short-url-api',
    }),
  );

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  process.on('SIGTERM', () => {
    void sdk.shutdown();
  });
}
