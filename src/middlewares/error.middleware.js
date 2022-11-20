import httpStatus from 'http-status'
import openApiValidation from 'openapi-validator-middleware'
import { APIError } from '#errors/common'
import logger from '#lib/logger'

export function errorHandlerMiddleware(err, req, res, _next) {
  logger.error({ err })

  if (err instanceof openApiValidation.InputValidationError) {
    const status = httpStatus.BAD_REQUEST
    return res.status(status).json({
      type: 'validation',
      message: 'Validation error',
      invalidParams: err.errors,
    })
  }

  if (err instanceof APIError) {
    const status = err.status ?? 500
    return res.status(status).json({
      type: err.type,
      title: err.title ?? httpStatus[status],
      detail: err.detail,
      // invalidParams: err?.invalidParams,
    })
  }

  res.status(500).json({
    type: 'internal',
    title: 'Internal error',
  })
}

export function notFoundMiddleware(req, res, next) {
  const err = new APIError({
    type: 'not_found',
    title: 'Not found',
    detail: '',
    status: httpStatus.NOT_FOUND,
  })

  next(err)
}
