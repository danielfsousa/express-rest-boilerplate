import { pino } from 'pino'
import { context, trace, isSpanContextValid } from '@opentelemetry/api'
import config from '#config'
import { LogFormat } from '#enums/log'

function otelMixin() {
  if (!config.otel.isEnabled) {
    return {}
  }

  const span = trace.getSpan(context.active())
  if (!span) {
    return {}
  }

  const spanContext = span.spanContext()
  if (!isSpanContextValid(spanContext)) {
    return {}
  }

  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_flags: `0${spanContext.traceFlags.toString(16)}`,
  }
}

const logger = pino({
  timestamp: true,
  level: config.log.level,
  base: {
    appVersion: config.version,
  },
  mixin: otelMixin,
  redact: ['config.auth.jwtSecret', 'config.mongo.uri', 'config.email.password'],
  transport:
    config.log.format === LogFormat.JSON
      ? undefined
      : {
          target: './logger-pretty.js',
          options: {
            ignore: 'appVersion',
            translateTime: 'SYS:HH:MM:ss.l',
          },
        },
})

export default logger
