import httpStatus from 'http-status'
import openApiValidation from 'openapi-validator-middleware'
import APIError from '#errors/api'
import logger from '#lib/logger'

export function errorHandlerMiddleware(err, req, res) {
  logger.error({ err })

  if (err instanceof openApiValidation.InputValidationError) {
    const status = httpStatus.BAD_REQUEST
    return res.status(status).json({
      code: status,
      message: 'Validation error',
      errors: err.errors,
    })
  }

  if (err instanceof APIError) {
    const status = err.status ?? 500
    return res.status(status).json({
      code: status,
      message: err.message ?? httpStatus[status],
      errors: err.errors,
    })
  }

  res.status(500).json({ code: 500, message: 'Internal error' })
}

export function notFoundMiddleware(req, res, next) {
  const err = new APIError({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  })

  next(err)
}
