import { context, trace } from '@opentelemetry/api'

export default function addTraceIdMiddleware(req, res, next) {
  const ctx = context.active()
  const spanContext = trace.getSpanContext(ctx)
  req.traceId = spanContext?.traceId
  next()
}
