import { trace } from '@opentelemetry/api';
import { describe, expect, test } from 'vite-plus/test';
import { createServer } from './node.ts';
import { getActiveTraceContext, initTelemetry, parseOtlpHeaders } from './telemetry.ts';

describe('OpenTelemetry and log correlation (packages/runtime)', () => {
  test('parseOtlpHeaders parses Grafana Cloud comma-separated headers', () => {
    expect(parseOtlpHeaders('Authorization=Basic abc123, X-Scope-OrgID=tenant-1')).toEqual({
      Authorization: 'Basic abc123',
      'X-Scope-OrgID': 'tenant-1',
    });
    expect(parseOtlpHeaders(undefined)).toEqual({});
  });

  test('exports OTLP traces with auth header and exposes active trace_id/span_id', async () => {
    const receivedTracePaths: Array<string> = [];
    const receivedAuthHeaders: Array<string | null> = [];

    const collector = await createServer({
      port: 0,
      hostname: '127.0.0.1',
      fetch: async (request) => {
        const url = new URL(request.url);
        receivedTracePaths.push(url.pathname);
        receivedAuthHeaders.push(request.headers.get('authorization'));
        return Response.json({ partialSuccess: {} }, { status: 200 });
      },
    });

    const telemetry = initTelemetry({
      serviceName: 'bookstore-test-service',
      enabled: true,
      endpoint: collector.url,
      headers: 'Authorization=Basic test-token',
      metricExportIntervalMs: 60_000,
    });

    try {
      const tracer = trace.getTracer('bookstore-test');
      let capturedTraceId = '';
      let capturedSpanId = '';

      tracer.startActiveSpan('test.order.process', (span) => {
        const ctx = getActiveTraceContext();
        capturedTraceId = ctx.trace_id ?? '';
        capturedSpanId = ctx.span_id ?? '';
        span.end();
      });

      expect(capturedTraceId.length).toBe(32);
      expect(capturedSpanId.length).toBe(16);

      await telemetry.shutdown();
      expect(receivedTracePaths).toContain('/v1/traces');
      expect(receivedAuthHeaders).toContain('Basic test-token');
    } finally {
      await collector.close();
    }
  });

  test('OTEL_ENABLED=false returns a clean no-op handle', async () => {
    const handle = initTelemetry({
      serviceName: 'bookstore-disabled',
      enabled: false,
    });
    await expect(handle.shutdown()).resolves.toBeUndefined();
  });
});
