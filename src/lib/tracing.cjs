// TODO: currently not supported for ESM modules
// https://github.com/open-telemetry/opentelemetry-js/pull/2846

require('dotenv').config()

const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const opentelemetry = require('@opentelemetry/sdk-node')

const { env } = process

const config = {
  opentelemetry: {
    serviceName: env.OTEL_SERVICE_NAME,
    endpoint: env.OTEL_EXPORTER_JAEGER_ENDPOINT,
  },
}

function applyPatches() {
  // TODO: remove
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

  const spanExporter = new JaegerExporter({ endpoint: config.opentelemetry.endpoint })

  const sdk = new opentelemetry.NodeSDK({
    serviceName: config.opentelemetry.serviceName,
    spanProcessor: new opentelemetry.tracing.BatchSpanProcessor(spanExporter),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
}

if (env.OTEL_ENABLED === 'true') {
  applyPatches()
}
