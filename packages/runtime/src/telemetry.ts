import { context, trace } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface InitTelemetryOptions {
  serviceName: string;
  enabled: boolean;
  endpoint?: string | undefined;
  headers?: string | undefined;
  metricExportIntervalMs?: number | undefined;
}

export interface TelemetryHandle {
  shutdown(): Promise<void>;
}

export interface TraceLogContext {
  trace_id?: string;
  span_id?: string;
}

export function parseOtlpHeaders(raw: string | undefined) {
  const parsed: Record<string, string> = {};
  if (!raw || raw.trim().length === 0) {
    return parsed;
  }
  for (const part of raw.split(',')) {
    const idx = part.indexOf('=');
    if (idx <= 0) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key.length > 0 && value.length > 0) {
      parsed[key] = value;
    }
  }
  return parsed;
}

export function getActiveTraceContext(): TraceLogContext {
  const span = trace.getSpan(context.active());
  if (!span) {
    return {};
  }
  const spanCtx = span.spanContext();
  if (!spanCtx.traceId || !spanCtx.spanId) {
    return {};
  }
  return {
    trace_id: spanCtx.traceId,
    span_id: spanCtx.spanId,
  };
}

export function initTelemetry({
  serviceName,
  enabled,
  endpoint = 'http://127.0.0.1:4318',
  headers,
  metricExportIntervalMs = 30_000,
}: InitTelemetryOptions): TelemetryHandle {
  if (!enabled) {
    return {
      async shutdown() {
        // Telemetry disabled.
      },
    };
  }

  const baseUrl = endpoint.replace(/\/+$/, '');
  const parsedHeaders = parseOtlpHeaders(headers);

  const traceExporter = new OTLPTraceExporter({
    url: `${baseUrl}/v1/traces`,
    headers: parsedHeaders,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${baseUrl}/v1/metrics`,
    headers: parsedHeaders,
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter,
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: metricExportIntervalMs,
      }),
    ],
    instrumentations: [new HttpInstrumentation(), new PinoInstrumentation()],
  });

  sdk.start();

  return {
    async shutdown() {
      await sdk.shutdown();
    },
  };
}
